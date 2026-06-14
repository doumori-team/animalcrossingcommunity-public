'use strict';

import * as Sentry from '@sentry/node';
import pLimit from 'p-limit';

import * as crypto from 'crypto';

import { pool, isConnectionError } from 'server/sessionStore.ts';
import { dateUtils, constants, utils } from '@utils';
import { ACCCache } from '@cache';
import {
	APIThisType,
	UserLiteType,
	UserType,
	NodeChildNodesType,
	NodeChildrenResultType,
	UserDonationsType,
} from '@types';
import { ProfanityError } from '@errors';

const dbLimit = pLimit(25);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryType = (sql: string, ...params: any[]) => Promise<any>;

/* This is just a wrapper around pool.query that gives it a slightly nicer
 * type-signature and discards all returned information except the actual result
 * of the query.
 *
 * Parameters:
 * 	sql - string representing the query to run
 * 	params - (optional) variables to substitue into the query if it is a
 * 		prepared statement
 *
 * Example:
 * 	await query('SELECT username FROM user WHERE user.id = $1::int', 373493);
 * returns [ { 'username': 'iolite' } ]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(sql: string, ...params: any[]): Promise<any>
{
	for (let attempt = 0; attempt < 2; attempt++)
	{
		try
		{
			const result = await dbLimit(() => pool.query(sql, params));
			return result.rows;
		}
		catch (err)
		{
			if (attempt === 0 && isConnectionError(err))
			{
				console.warn('Retrying query after connection error...', sql);
				continue;
			}

			throw err;
		}
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheQuery(method: string, sql: string, ...params: any[]): Promise<any>
{
	const cacheKey = `${method}_sql_${crypto.createHash('sha1').update(sql + params.toString()).digest('hex')}`;

	return await ACCCache.get(cacheKey, async () =>
	{
		return await query(sql, ...params);
	});
}

/* Similar to db.query, this function allows you to run multiple queries
 * together as part of a transaction. If one query in the transaction fails, the
 * whole thing will be rolled back.
 *
 * Parameters:
 * 	operate - function; the code to run as part of the transaction. There is one
 * 		parameter, query, which is a function itself and exactly like db.query()
 * 		except that it will add the query to the transaction instead of running
 * 		it directly.
 *
 * Example:
 * 	await transaction(async (query) =>
 * 	{
 * 		await query('INSERT INTO table (field) VALUES ($1::int)', 42);
 * 		await query('THIS QUERY WILL CAUSE A SYNTAX ERROR');
 * 		// no record is inserted into the table
 * 	});
 *
 * Returns whatever operate() returns.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function transaction(operate: Function): Promise<any>
{
	for (let attempt = 0; attempt < 2; attempt++)
	{
		let client;

		try
		{
			client = await dbLimit(() => pool.connect());

			await client.query('BEGIN');

			const returnVal = await operate(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				async (sql: string, ...params: any[]) =>
				{
					const result = await client.query(sql, params);
					return result.rows;
				},
			);

			await client.query('COMMIT');
			client.release();
			return returnVal;
		}
		catch (error)
		{
			if (client)
			{
				try
				{
					await client.query('ROLLBACK');
				}
				catch (_)
				{
					// ignore rollback failure (connection likely dead)
				}

				client.release();
			}

			if (attempt === 0 && isConnectionError(error))
			{
				console.warn('Retrying transaction after connection error...');
				continue;
			}

			throw error;
		}
	}
}

/* Given up-to-date information about a user account, stores it in the cache.
 * Returns the original parameter.
 */
export async function updateAccountCache({ id, username, signup_date }: { id: number, username: string, signup_date: string }): Promise<{ id: number, username: string, signup_date: string }>
{
	signup_date = dateUtils.formatYearMonthDay2(signup_date);

	await query(`
		INSERT INTO users (id)
		VALUES ($1::int)
		ON CONFLICT (id) DO NOTHING
	`, id);
	await query(`
		INSERT INTO user_account_cache (id, last_update, username, signup_date)
		VALUES ($1::int, now(), $2::text, $3::date)
		ON CONFLICT (id) DO UPDATE
		SET last_update = now(), username = $2::text, signup_date = $3::date
	`, id, username, signup_date);

	// make test-new-member a new member
	if (id === 840408 && !dateUtils.isNewMember(signup_date))
	{
		const [updatedSignupDate] = await query(`
			UPDATE user_account_cache
			SET signup_date = current_date
			WHERE id = $1::int
			RETURNING signup_date
		`, id);

		signup_date = updatedSignupDate.signup_date;
	}

	return { id, username, signup_date };
}

export async function updateThreadStats(nodeId: number): Promise<void>
{
	await query(`
		UPDATE node
		SET latest_reply_time = (
			SELECT child.creation_time
			FROM node AS child
			WHERE child.parent_node_id = node.id
			ORDER BY child.creation_time DESC
			LIMIT 1
		), reply_count = (
			SELECT count(*)
			FROM node AS child
			WHERE child.parent_node_id = node.id
		)
		WHERE node.type = 'thread' AND node.id = $1
	`, nodeId);

	await updatePTsLookup(nodeId);
}

/**
 * Generate top bell stats.
 */
export async function regenerateTopBells({ userId }: { userId: number }): Promise<void>
{
	const [[totalBellsCur], [totalBellsSeasonal], [missedBellsCur], [missedBellsSeasonal], [totalJackpotBellsCur], [totalJackpotBellsSeasonal], [jackpotsFoundCur], [jackpotsFoundSeasonal], [jackpotsMissedCur], [jackpotsMissedSeasonal], topBellsLatest, topBellsLastJackpot] = await Promise.all([
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND offer >= (SELECT updated FROM site_setting WHERE id = 6)
		`, userId),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2) AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId, constants.bellThreshold),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2) AND offer >= (SELECT updated FROM site_setting WHERE id = 6)
		`, userId, constants.bellThreshold),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 6)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 6)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 6)
		`, userId),
		query(`
			SELECT total_bells, missed_bells, total_jackpot_bells, jackpots_found, jackpots_missed
			FROM top_bell_latest
			WHERE user_id = $1
		`, userId),
		query(`
			SELECT total_bells, missed_bells, total_jackpot_bells, jackpots_found, jackpots_missed
			FROM top_bell_last_jackpot
			WHERE user_id = $1
		`, userId),
	]);

	let totalBells = Number(totalBellsCur.bells);
	let missedBells = Number(missedBellsCur.bells);
	let totalJackpotBells = Number(totalJackpotBellsCur.bells);
	let jackpotsFound = Number(jackpotsFoundCur.jackpots);
	let jackpotsMissed = Number(jackpotsMissedCur.jackpots);

	if (topBellsLatest && topBellsLatest[0])
	{
		totalBells += Number(topBellsLatest[0].total_bells);
		missedBells += Number(topBellsLatest[0].missed_bells);
		totalJackpotBells += Number(topBellsLatest[0].total_jackpot_bells);
		jackpotsFound += Number(topBellsLatest[0].jackpots_found);
		jackpotsMissed += Number(topBellsLatest[0].jackpots_missed);
	}

	if (topBellsLastJackpot && topBellsLastJackpot[0])
	{
		totalBells += Number(topBellsLastJackpot[0].total_bells);
		missedBells += Number(topBellsLastJackpot[0].missed_bells);
		totalJackpotBells += Number(topBellsLastJackpot[0].total_jackpot_bells);
		jackpotsFound += Number(topBellsLastJackpot[0].jackpots_found);
		jackpotsMissed += Number(topBellsLastJackpot[0].jackpots_missed);
	}

	await query(`
		INSERT INTO top_bell (user_id, total_bells, missed_bells, total_jackpot_bells, jackpots_found, jackpots_missed)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			total_bells = EXCLUDED.total_bells,
			missed_bells = EXCLUDED.missed_bells,
			total_jackpot_bells = EXCLUDED.total_jackpot_bells,
			jackpots_found = EXCLUDED.jackpots_found,
			jackpots_missed = EXCLUDED.jackpots_missed
	`, userId, totalBells, missedBells, totalJackpotBells, jackpotsFound, jackpotsMissed);

	query(`
		REFRESH MATERIALIZED VIEW CONCURRENTLY top_bell_search
	`);

	let totalBellsSeasonalTotal = Number(totalBellsSeasonal.bells);
	let missedBellsSeasonalTotal = Number(missedBellsSeasonal.bells);
	let totalJackpotBellsSeasonalTotal = Number(totalJackpotBellsSeasonal.bells);
	let jackpotsFoundSeasonalTotal = Number(jackpotsFoundSeasonal.jackpots);
	let jackpotsMissedSeasonalTotal = Number(jackpotsMissedSeasonal.jackpots);

	await query(`
		INSERT INTO seasonal_bell (user_id, total_bells, missed_bells, total_jackpot_bells, jackpots_found, jackpots_missed)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			total_bells = EXCLUDED.total_bells,
			missed_bells = EXCLUDED.missed_bells,
			total_jackpot_bells = EXCLUDED.total_jackpot_bells,
			jackpots_found = EXCLUDED.jackpots_found,
			jackpots_missed = EXCLUDED.jackpots_missed
	`, userId, totalBellsSeasonalTotal, missedBellsSeasonalTotal, totalJackpotBellsSeasonalTotal, jackpotsFoundSeasonalTotal, jackpotsMissedSeasonalTotal);

	query(`
		REFRESH MATERIALIZED VIEW CONCURRENTLY seasonal_bell_search
	`);
}

export async function updatePTsLookup(nodeId: number): Promise<void>
{
	await transaction(async (tranQuery: Function) =>
	{
		await tranQuery(`
			DELETE FROM pts_user_read_granted
			WHERE node_id = $1
		`, nodeId);

		await tranQuery(`
			INSERT INTO pts_user_read_granted (node_id, node_user_id, creation_time, locked, thread_type, latest_reply_time, reply_count, permission_user_id)
			SELECT
				node.id,
				node.user_id AS node_user_id,
				node.creation_time,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count,
				user_node_permission.user_id AS permission_user_id
			FROM node
			JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			WHERE node.id = $1 AND node.parent_node_id = $2 AND node.type = 'thread' AND user_node_permission.node_permission_id = $3 AND user_node_permission.granted = true
		`, nodeId, constants.boardIds.privateThreads, constants.nodePermissions.read);
	});
}

export async function updatePTsLookupMass(nodeIds: number[]): Promise<void>
{
	await transaction(async (tranQuery: Function) =>
	{
		await tranQuery(`
			DELETE FROM pts_user_read_granted
			WHERE node_id = ANY($1)
		`, nodeIds);

		await tranQuery(`
			INSERT INTO pts_user_read_granted (node_id, node_user_id, creation_time, locked, thread_type, latest_reply_time, reply_count, permission_user_id)
			SELECT
				node.id,
				node.user_id AS node_user_id,
				node.creation_time,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count,
				user_node_permission.user_id AS permission_user_id
			FROM node
			JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			WHERE node.id = ANY($1) AND node.parent_node_id = $2 AND node.type = 'thread' AND user_node_permission.node_permission_id = $3 AND user_node_permission.granted = true
		`, nodeIds, constants.boardIds.privateThreads, constants.nodePermissions.read);
	});
}

export async function getUserGroups(userId: APIThisType['userId']): Promise<number[]>
{
	if (!userId)
	{
		return [0];
	}

	const groupIds = await query(`
		WITH RECURSIVE ENTRIES as (
			SELECT id, parent_id, name, id AS root_id, 1 AS level
			FROM user_group
			WHERE id = (SELECT user_group_id FROM users WHERE id = $1)
			UNION ALL
			SELECT c.id, c.parent_id, c.name, p.root_id, p.level + 1
			FROM user_group c
			JOIN entries p ON (p.parent_id = c.id)
		)
		SELECT id
		FROM entries
		ORDER BY root_id, level, id
	`, userId);

	return groupIds.map((gid: { id: string }) => Number(gid.id));
}

export async function getLatestPage(nodeId: number | string, userId: number): Promise<[{ latest_page: number }]>
{
	return query(`
		SELECT
			CEIL(
				(
					before_count +
					CASE WHEN exists_after THEN 1 ELSE 0 END
				) / $3::float
			) AS latest_page
		FROM (
			SELECT
				-- count posts before last_checked
				COUNT(*) FILTER (WHERE node.creation_time < node_user.last_checked) AS before_count,

				-- does at least one post exist after last_checked?
				BOOL_OR(node.creation_time > node_user.last_checked) AS exists_after
			FROM node
			CROSS JOIN (
				SELECT last_checked
				FROM node_user
				WHERE node_id = $1 AND user_id = $2
			) node_user
			WHERE node.parent_node_id = $1
		) x
	`, nodeId, userId, constants.threadPageSize);
}

export async function getLatestPost(nodeId: number | string, userId: number): Promise<[{ latest_post: number }]>
{
	return query(`
		SELECT lp.id AS latest_post
		FROM (
			SELECT last_checked
			FROM node_user
			WHERE node_id = $1 AND user_id = $2
		) node_user
		LEFT JOIN LATERAL (
			SELECT id
			FROM node
			WHERE parent_node_id = $1
			AND creation_time > node_user.last_checked
			ORDER BY creation_time ASC
			LIMIT 1
		) lp ON true
	`, nodeId, userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getChildren(resultsQuery: Promise<any>, thisQuery: APIThisType['query'], userId: APIThisType['userId'], parentChildren = false): Promise<[number, NodeChildNodesType[]]>
{
	const [results, viewFollowersPerm, userSettings]: [NodeChildrenResultType[], boolean, { show_images: boolean, concise_mode: number, hide_post_emojis: boolean } | null] = await Promise.all([
		resultsQuery,
		thisQuery('v1/permission', { permission: 'view-followers' }),
		userId ? query(`
			SELECT show_images, concise_mode, hide_post_emojis
			FROM users
			WHERE id = $1::int
		`, userId) : null,
	]);

	if (results.length === 0)
	{
		return [0, []];
	}

	const count = Number(results[0].count);
	const conciseMode: number = userSettings && userSettings[0] ? Number(userSettings[0].concise_mode) : 2;

	// Collect IDs for batch queries
	const allNodeIds: number[] = results.map(n => n.id);
	const postNodes = results.filter(n => n.type === 'post');
	const threadNodes = results.filter(n => n.type === 'thread');
	const boardNodes = results.filter(n => n.type === 'board');
	const boardAndThreadNodes = results.filter(n => ['board', 'thread'].includes(n.type));

	const postNodeIds = postNodes.map(n => n.id);
	const threadNodeIds = threadNodes.map(n => n.id);
	const boardAndThreadNodeIds = boardAndThreadNodes.map(n => n.id);

	const postRevisionIds = postNodes.map(n => n.revision_id).filter(Boolean);

	// Unique user IDs for deduplication
	const threadUserIds = [...new Set(threadNodes.map(n => n.user_id).filter(Boolean))];
	const postUserIds = [...new Set(postNodes.map(n => n.user_id).filter(Boolean))];
	const ptOrShopNodeIds = results
		.filter(n => [constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(Number(n.parent_node_id)))
		.map(n => n.id);

	// --- BATCH QUERIES ---
	// Run all bulk queries in parallel

	const [
		// 0: parent titles for threads
		parentTitles,
		// 1: user_lite results for thread authors (deduplicated)
		threadUserResults,
		// 2: user results for post authors (deduplicated)
		postUserResults,
		// 3: PT/Shop Thread invited users
		ptUsers,
		// 4: followed_node for current user
		followedNodes,
		// 5: notified_node for current user
		notifiedNodes,
		// 6: follower counts for threads (not PTs)
		followerCounts,
		// 7: revision counts for posts
		revisionCounts,
		// 8: latest page for threads
		latestPages,
		// 9: latest post for threads
		latestPosts,
		// 10: last_checked for threads
		lastCheckedResults,
		// 11: lock permissions for threads
		threadLockPerms,
		// 12: unread counts for threads
		unreadCounts,
		// 13: files for posts
		postFiles,
		// 14: donations for thread authors (deduplicated)
		donationResults,
		// 15: read permissions for boards/threads (non-parentChildren)
		readPerms,
		// 16: forum categories for boards
		forumCategories,
		// 17: quotes for posts
		postQuotes,
		// 18: reaction counts for posts
		reactionCounts,
		// 19: user reactions for posts
		userReactions,
		// 20: react permissions per parent thread
		postReactPerms,
		// 21: polls for posts
		pollOptions,
		// 22: user poll answers
		userPollAnswers,
		// 23: poll total users
		pollTotalUsers,
		// 24: thread reply permission (for poll active state)
		threadReplyPerms,
	] = await Sentry.startSpan({ name: 'getChildren.batchQueries' }, () => Promise.all([
		// 0: parent titles for threads
		threadNodes.length > 0 ? query(`
			SELECT node_id, title
			FROM (
				SELECT nr.node_id, nr.title, ROW_NUMBER() OVER (PARTITION BY nr.node_id ORDER BY nr.time DESC) AS rn
				FROM node_revision nr
				WHERE nr.node_id = ANY($1::int[])
			) sub
			WHERE rn = 1
		`, [...new Set(threadNodes.map(n => n.parent_node_id))]) : [],

		// 1: user_lite for thread authors (deduplicated; batched directly from user_account_cache)
		threadUserIds.length > 0 ? query(`
			SELECT id, username
			FROM user_account_cache
			WHERE id = ANY($1::int[])
		`, threadUserIds) : [],

		// 2: user for post authors (deduplicated)
		Promise.all(postUserIds.map(uid => thisQuery('v1/user', { id: uid }).catch(() => null))),

		// 3: PT/Shop Thread invited users
		ptOrShopNodeIds.length > 0 ? query(`
			SELECT
				user_node_permission.node_id,
				user_account_cache.id,
				user_account_cache.username,
				user_node_permission.granted
			FROM user_account_cache
			JOIN user_node_permission ON (user_node_permission.user_id = user_account_cache.id)
			WHERE user_node_permission.node_id = ANY($1::int[]) AND user_node_permission.node_permission_id = $2
			ORDER BY user_account_cache.username ASC
		`, ptOrShopNodeIds, constants.nodePermissions.read) : [],

		// 4: followed_node
		userId ? query(`
			SELECT node_id
			FROM followed_node
			WHERE node_id = ANY($1::int[]) AND user_id = $2::int
		`, allNodeIds, userId) : [],

		// 5: notified_node
		userId && boardAndThreadNodeIds.length > 0 ? query(`
			SELECT node_id
			FROM notified_node
			WHERE node_id = ANY($1::int[]) AND user_id = $2::int
		`, boardAndThreadNodeIds, userId) : [],

		// 6: follower counts for non-PT threads
		viewFollowersPerm && threadNodeIds.length > 0 ? query(`
			SELECT node_id, count(*) AS count
			FROM followed_node
			WHERE node_id = ANY($1::int[])
			GROUP BY node_id
		`, threadNodeIds.filter(id => id !== constants.boardIds.privateThreads)) : [],

		// 7: revision counts for posts
		postNodeIds.length > 0 ? query(`
			SELECT node_id, count(*) AS count
			FROM node_revision
			WHERE node_id = ANY($1::int[])
			GROUP BY node_id
		`, postNodeIds) : [],

		// 8: latest page for threads (batched)
		userId && threadNodeIds.length > 0 ? query(`
			SELECT sub.node_id, CEIL(
				(sub.before_count + CASE WHEN sub.exists_after THEN 1 ELSE 0 END) / $3::float
			) AS latest_page
			FROM (
				SELECT
					node.parent_node_id AS node_id,
					COUNT(*) FILTER (WHERE node.creation_time < node_user.last_checked) AS before_count,
					BOOL_OR(node.creation_time > node_user.last_checked) AS exists_after
				FROM node
				JOIN node_user ON (node_user.node_id = node.parent_node_id AND node_user.user_id = $2::int)
				WHERE node.parent_node_id = ANY($1::int[])
				GROUP BY node.parent_node_id, node_user.last_checked
			) sub
		`, threadNodeIds, userId, constants.threadPageSize) : [],

		// 9: latest post for threads (batched)
		userId && threadNodeIds.length > 0 ? query(`
			SELECT node_user.node_id, lp.id AS latest_post
			FROM node_user
			LEFT JOIN LATERAL (
				SELECT id
				FROM node
				WHERE parent_node_id = node_user.node_id
				AND creation_time > node_user.last_checked
				ORDER BY creation_time ASC
				LIMIT 1
			) lp ON true
			WHERE node_user.node_id = ANY($1::int[]) AND node_user.user_id = $2::int
		`, threadNodeIds, userId) : [],

		// 10: last_checked for threads
		userId && threadNodeIds.length > 0 ? query(`
			SELECT node_id, last_checked
			FROM node_user
			WHERE node_id = ANY($1::int[]) AND user_id = $2::int
		`, threadNodeIds, userId) : [],

		// 11: lock perms for threads
		// returning nothing; we can use parent (board) permission for thread locking;
		// if you have permissiont to lock 'board' then it's for the thread
		// no case where you can lock thread not board; this is for admins mass locking threads
		[],

		// 12: unread counts for threads
		userId && threadNodeIds.length > 0 ? query(`
			SELECT node_user.node_id, (
				SELECT count(*) AS count
				FROM node
				WHERE node.parent_node_id = node_user.node_id AND node.creation_time > node_user.last_checked
			) AS count
			FROM node_user
			WHERE node_user.node_id = ANY($1::int[]) AND node_user.user_id = $2::int
		`, threadNodeIds, userId) : [],

		// 13: files for posts
		postRevisionIds.length > 0 ? query(`
			SELECT node_revision_file.node_revision_id, file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = ANY($1::int[])
			ORDER BY file.sequence ASC
		`, postRevisionIds) : [],

		// 14: perks for thread authors (deduplicated & batched — only field used by frontend)
		threadUserIds.length > 0 ? query(`
			SELECT user_id, COALESCE(sum(donation), 0) AS perks
			FROM user_donation
			WHERE user_id = ANY($1::int[]) AND donated >= now() - interval '1' year
			GROUP BY user_id
		`, threadUserIds) : [],

		// 15: read perms for boards/threads (only when not parentChildren)
		!parentChildren && allNodeIds.length > 0
			? Promise.all(allNodeIds.map(nid => thisQuery('v1/node/permission', { permission: 'read', nodeId: nid }).then(r => ({ nodeId: nid, granted: r })).catch(() => ({ nodeId: nid, granted: false }))))
			: [],

		// 16: forum categories for boards
		boardNodes.length > 0 ? query(`
			SELECT ncl.node_id, nc.id, nc.title, ncl.order
			FROM node_category nc
			INNER JOIN node_category_link ncl ON nc.id = ncl.category_id
			WHERE ncl.node_id = ANY($1::int[])
		`, boardNodes.map(n => n.id)) : [],

		// 17: quotes for posts
		postRevisionIds.length > 0 && postNodes.length > 0 ? query(`
			WITH thread_posts AS (
				SELECT
					node.id AS node_id,
					node.parent_node_id,
					ROW_NUMBER() OVER (
						PARTITION BY node.parent_node_id
						ORDER BY node.creation_time ASC
					) AS post_number
				FROM node
				WHERE node.parent_node_id = ANY($2::int[])
			)
			SELECT
				node_revision_quote.node_revision_id,
				node_revision_quote.node_id,
				CEIL(thread_posts.post_number / $3::float) AS page,
				node_revision_quote.sort_order
			FROM node_revision_quote
			JOIN thread_posts ON thread_posts.node_id = node_revision_quote.node_id
			WHERE node_revision_quote.node_revision_id = ANY($1::int[])
			ORDER BY node_revision_quote.sort_order ASC
		`, postRevisionIds, [...new Set(postNodes.map(n => n.parent_node_id))], constants.threadPageSize) : [],

		// 18: reaction counts for posts
		postNodeIds.length > 0 ? query(`
			SELECT node_reaction.node_id, node_reaction.emoji, count(*) AS count
			FROM node_reaction
			WHERE node_reaction.node_id = ANY($1::int[])
			GROUP BY node_reaction.node_id, node_reaction.emoji
			ORDER BY count(*) DESC
		`, postNodeIds) : [],

		// 19: user reactions for posts
		userId && postNodeIds.length > 0 ? query(`
			SELECT node_reaction.node_id, node_reaction.emoji
			FROM node_reaction
			WHERE node_reaction.node_id = ANY($1::int[]) AND node_reaction.user_id = $2::int
			ORDER BY node_reaction.id ASC
		`, postNodeIds, userId) : [],

		// 20: react perms per unique parent thread (not per post)
		// SYNC WITH v1/node/permission: react is a board/group-level perm, same for all posts in a thread
		postNodes.length > 0 ? Promise.all(
			[...new Set(postNodes.map(n => n.parent_node_id))].map(nid =>
				thisQuery('v1/node/permission', { permission: 'react', nodeId: nid })
					.then(r => ({ nodeId: nid, granted: r }))
					.catch(() => ({ nodeId: nid, granted: false })),
			),
		) : [],

		// 21: poll options for posts
		postRevisionIds.length > 0 ? query(`
			SELECT
				node_revision_poll.node_revision_id,
				node_revision_poll.id AS poll_id,
				node_revision_poll.sort_order,
				node_revision_poll_option.description,
				node_revision_poll_option.sequence,
				node_revision_poll_option.votes
			FROM node_revision_poll_option
			JOIN node_revision_poll ON (node_revision_poll_option.poll_id = node_revision_poll.id)
			WHERE node_revision_poll.node_revision_id = ANY($1::int[])
			ORDER BY node_revision_poll.sort_order ASC, node_revision_poll_option.sequence ASC
		`, postRevisionIds) : [],

		// 22: user poll answers
		userId && postRevisionIds.length > 0 ? query(`
			SELECT node_revision_poll.node_revision_id, node_revision_poll_answer.poll_id
			FROM node_revision_poll_answer
			JOIN node_revision_poll ON (node_revision_poll_answer.poll_id = node_revision_poll.id)
			WHERE node_revision_poll.node_revision_id = ANY($1::int[]) AND node_revision_poll_answer.user_id = $2
		`, postRevisionIds, userId) : [],

		// 23: poll total users
		postRevisionIds.length > 0 ? query(`
			SELECT node_revision_poll.node_revision_id, node_revision_poll_answer.poll_id, count(*) AS count
			FROM node_revision_poll_answer
			JOIN node_revision_poll ON (node_revision_poll_answer.poll_id = node_revision_poll.id)
			WHERE node_revision_poll.node_revision_id = ANY($1::int[])
			GROUP BY node_revision_poll.node_revision_id, node_revision_poll_answer.poll_id
		`, postRevisionIds) : [],

		// 24: thread reply perms (for poll active state — need parent thread reply perm)
		postNodes.length > 0 ? Promise.all(
			[...new Set(postNodes.map(n => n.parent_node_id))].map(nid =>
				thisQuery('v1/node/permission', { permission: 'reply', nodeId: nid })
					.then(r => ({ nodeId: nid, granted: r }))
					.catch(() => ({ nodeId: nid, granted: false })),
			),
		) : [],
	]));

	// --- BUILD LOOKUP MAPS ---

	// User lookups (deduplicated)
	const threadUserMap = new Map<number, UserLiteType>();
	threadUserResults.forEach((r: { id: number, username: string }) =>
	{
		threadUserMap.set(r.id, { id: r.id, username: r.username });
	});

	const postUserMap = new Map<number, UserType>();
	postUserIds.forEach((uid, i) =>
	{
		if (postUserResults[i])
		{
			postUserMap.set(uid, postUserResults[i]);
		}
	});

	// Parent titles: parentNodeId -> title
	const parentTitleMap = new Map<number, string>();
	parentTitles.forEach((r: { node_id: number, title: string }) => parentTitleMap.set(r.node_id, r.title));

	// PT/Shop users: nodeId -> users[]
	const ptUsersMap = new Map<number, { id: string, username: string, granted: boolean }[]>();
	ptUsers.forEach((r: { node_id: number, id: number, username: string, granted: boolean }) =>
	{
		if (!ptUsersMap.has(r.node_id)) ptUsersMap.set(r.node_id, []);
		ptUsersMap.get(r.node_id)!.push({ id: String(r.id), username: r.username, granted: r.granted });
	});

	// Followed nodes: Set of nodeIds
	const followedSet = new Set<number>(followedNodes.map((r: { node_id: number }) => r.node_id));

	// Notified nodes: Set of nodeIds
	const notifiedSet = new Set<number>(notifiedNodes.map((r: { node_id: number }) => r.node_id));

	// Follower counts: nodeId -> count
	const followerCountMap = new Map<number, number>();
	followerCounts.forEach((r: { node_id: number, count: number }) => followerCountMap.set(r.node_id, Number(r.count)));

	// Revision counts: nodeId -> count
	const revisionCountMap = new Map<number, number>();
	revisionCounts.forEach((r: { node_id: number, count: number }) => revisionCountMap.set(r.node_id, Number(r.count)));

	// Edit perms: short-circuited inline — edit is granted iff userId === node.user_id
	// SYNC WITH v1/node/permission

	// Latest page: nodeId -> page number
	const latestPageMap = new Map<number, number | null>();
	latestPages.forEach((r: { node_id: number, latest_page: number }) => latestPageMap.set(r.node_id, r.latest_page));

	// Latest post: nodeId -> post id
	const latestPostMap = new Map<number, number | null>();
	latestPosts.forEach((r: { node_id: number, latest_post: number | null }) => latestPostMap.set(r.node_id, r.latest_post));

	// Last checked: nodeId -> last_checked
	const lastCheckedMap = new Map<number, Date>();
	lastCheckedResults.forEach((r: { node_id: number, last_checked: Date }) => lastCheckedMap.set(r.node_id, r.last_checked));

	// Lock perms: nodeId -> boolean
	const lockPermMap = new Map<number, boolean>();
	threadLockPerms.forEach((r: { nodeId: number, granted: boolean }) => lockPermMap.set(r.nodeId, r.granted));

	// Unread counts: nodeId -> count
	const unreadCountMap = new Map<number, number>();
	unreadCounts.forEach((r: { node_id: number, count: number }) => unreadCountMap.set(r.node_id, Number(r.count)));

	// Files: revisionId -> files[]
	const filesMap = new Map<number, { id: number, file_id: string, name: string, width: number, height: number, caption: string }[]>();
	postFiles.forEach((r: { node_revision_id: number, id: number, file_id: string, name: string, width: number, height: number, caption: string }) =>
	{
		if (!filesMap.has(r.node_revision_id)) filesMap.set(r.node_revision_id, []);
		filesMap.get(r.node_revision_id)!.push({ id: r.id, file_id: r.file_id, name: r.name, width: r.width, height: r.height, caption: r.caption });
	});

	// Donations: userId -> donations
	const donationMap = new Map<number, UserDonationsType>();
	donationResults.forEach((r: { user_id: number, perks: string }) =>
	{
		donationMap.set(r.user_id, {
			id: r.user_id,
			donations: 0,
			perks: Number(r.perks),
			monthlyPerks: 0,
		});
	});

	// Read perms: nodeId -> boolean
	const readPermMap = new Map<number, boolean>();
	if (!parentChildren)
	{
		(readPerms as { nodeId: number, granted: boolean }[]).forEach(r => readPermMap.set(r.nodeId, r.granted));
	}

	// Forum categories: nodeId -> category (first match only, matches LIMIT 1 in original)
	const forumCategoryMap = new Map<number, { id: number, title: string, order: number }>();
	forumCategories.forEach((r: { node_id: number, id: number, title: string, order: number }) =>
	{
		if (!forumCategoryMap.has(r.node_id)) forumCategoryMap.set(r.node_id, { id: r.id, title: r.title, order: r.order });
	});

	// Quotes: revisionId -> quotes[]
	const quotesMap = new Map<number, { node_id: number, sort_order: number, page: number }[]>();
	postQuotes.forEach((r: { node_revision_id: number, node_id: number, sort_order: number, page: number }) =>
	{
		if (!quotesMap.has(r.node_revision_id)) quotesMap.set(r.node_revision_id, []);
		quotesMap.get(r.node_revision_id)!.push({ node_id: r.node_id, sort_order: r.sort_order, page: r.page });
	});

	// Reactions: nodeId -> reactions[]
	const reactionCountsMap = new Map<number, { emoji: string, count: number }[]>();
	reactionCounts.forEach((r: { node_id: number, emoji: string, count: number }) =>
	{
		if (!reactionCountsMap.has(r.node_id)) reactionCountsMap.set(r.node_id, []);
		reactionCountsMap.get(r.node_id)!.push({ emoji: r.emoji, count: Number(r.count) });
	});

	// User reactions: nodeId -> Set of emoji
	const userReactionMap = new Map<number, Set<string>>();
	if (userReactions)
	{
		userReactions.forEach((r: { node_id: number, emoji: string }) =>
		{
			if (!userReactionMap.has(r.node_id)) userReactionMap.set(r.node_id, new Set());
			userReactionMap.get(r.node_id)!.add(r.emoji);
		});
	}

	// React perms: parentNodeId -> boolean (board-level perm, same for all posts in thread)
	// SYNC WITH v1/node/permission
	const reactPermMap = new Map<number, boolean>();
	postReactPerms.forEach((r: { nodeId: number, granted: boolean }) => reactPermMap.set(r.nodeId, r.granted));

	// Polls: revisionId -> Map<pollId, poll>
	const pollsPerRevision = new Map<number, Map<number, NodeChildNodesType['polls'][number]>>();

	// Thread reply perms for poll active state: parentNodeId -> boolean
	const threadReplyPermMap = new Map<number, boolean>();
	threadReplyPerms.forEach((r: { nodeId: number, granted: boolean }) => threadReplyPermMap.set(r.nodeId, r.granted));

	// User poll answer set: revisionId -> Set of pollIds
	const userPollMap = new Map<number, Set<number>>();
	if (userPollAnswers)
	{
		userPollAnswers.forEach((r: { node_revision_id: number, poll_id: number }) =>
		{
			if (!userPollMap.has(r.node_revision_id)) userPollMap.set(r.node_revision_id, new Set());
			userPollMap.get(r.node_revision_id)!.add(r.poll_id);
		});
	}

	// Poll total users: pollId -> count
	const pollTotalMap = new Map<number, number>();
	pollTotalUsers.forEach((r: { poll_id: number, count: number }) => pollTotalMap.set(r.poll_id, Number(r.count)));

	// Build polls map
	pollOptions.forEach((r: { node_revision_id: number, poll_id: number, sort_order: number, description: string, sequence: number, votes: number }) =>
	{
		if (!pollsPerRevision.has(r.node_revision_id))
		{
			pollsPerRevision.set(r.node_revision_id, new Map());
		}

		const revPolls = pollsPerRevision.get(r.node_revision_id)!;
		const userPolls = userPollMap.get(r.node_revision_id);

		if (!revPolls.has(r.poll_id))
		{
			// Find the parent node id for this revision to get reply perm
			const postNode = postNodes.find(n => n.revision_id === r.node_revision_id);
			const threadReplyPerm = postNode ? threadReplyPermMap.get(postNode.parent_node_id) ?? false : false;

			revPolls.set(r.poll_id, {
				id: r.poll_id,
				sortOrder: r.sort_order,
				options: [],
				userVoted: userPolls ? userPolls.has(r.poll_id) : false,
				totalUsers: pollTotalMap.get(r.poll_id) ?? 0,
				active: threadReplyPerm,
			});
		}

		revPolls.get(r.poll_id)!.options.push({
			description: r.description,
			sequence: r.sequence,
			votes: r.votes,
		});
	});

	// --- FILTER AND MAP RESULTS ---

	if (!parentChildren)
	{
		results
			.filter(node => !readPermMap.get(node.id))
			.forEach(node =>
			{
				console.error(`getChildren for ${userId}, permission read error for node ${node.id}`);
			});
	}

	const childNodes: NodeChildNodesType[] = results
		.filter(node => parentChildren || readPermMap.get(node.id))
		.map(node =>
		{
			const isPost = node.type === 'post';
			const isThread = node.type === 'thread';
			const isBoard = node.type === 'board';

			// User lookup
			const user = node.user_id
				? isThread
					? threadUserMap.get(node.user_id) ?? null
					: postUserMap.get(node.user_id) ?? null
				: null;

			// Permissions
			// SYNC WITH v1/node/permission if permission logic changes
			const permissions: string[] = [];
			if (isPost && userId && node.user_id === userId) permissions.push('edit');
			if (isThread && lockPermMap.get(node.id)) permissions.push('lock');
			if (isPost && reactPermMap.get(node.parent_node_id)) permissions.push('react');

			// Thread-specific
			const latestPage = isThread ? latestPageMap.get(node.id) ?? null : null;
			const latestPost = isThread ? latestPostMap.get(node.id) ?? null : null;
			const hasLastChecked = isThread && lastCheckedMap.has(node.id);

			const replies = node.reply_count ? Number(node.reply_count) - 1 : 0;

			// Unread
			const unreadTotal = isThread
				? unreadCountMap.has(node.id) ? unreadCountMap.get(node.id)! : replies + 1
				: null;

			// Files
			const nodeFiles = isPost ? filesMap.get(node.revision_id) ?? [] : [];

			// Reactions
			const nodeUserReactions = userReactionMap.get(node.id);
			const nodeReactions = isPost
				? (reactionCountsMap.get(node.id) ?? []).map(reaction => ({
					...reaction,
					src: reaction.emoji,
					usedByUser: nodeUserReactions ? nodeUserReactions.has(reaction.emoji) : false,
				}))
				: [];

			// Quotes
			const nodeQuotes = isPost
				? (quotesMap.get(node.revision_id) ?? []).map(nq => ({
					nodeId: nq.node_id,
					sortOrder: nq.sort_order,
					page: nq.page,
				}))
				: [];

			// Polls
			const revPolls = isPost ? pollsPerRevision.get(node.revision_id) : null;

			// Forum category
			const forumCategory = isBoard ? forumCategoryMap.get(node.id) ?? null : null;

			// Follower count
			const numFollowed = viewFollowersPerm && isThread && node.id !== constants.boardIds.privateThreads
				? followerCountMap.get(node.id) ?? 0
				: 0;

			return <NodeChildNodesType>{
				id: node.id,
				type: node.type,
				parentId: node.parent_node_id,
				parentId2: node.parent_node_id2,
				revisionId: node.revision_id,
				postNumber: node.post_number,
				page: node.page_number,
				title: node.title,
				created: node.creation_time,
				formattedCreated: dateUtils.formatDateTime(node.creation_time),
				locked: node.locked,
				threadType: node.thread_type,
				edits: isPost ? (revisionCountMap.get(node.id) ?? 1) - 1 : 0,
				followed: followedSet.has(node.id),
				notified: notifiedSet.has(node.id),
				numFollowed: numFollowed,
				board: isThread ? parentTitleMap.get(node.parent_node_id) ?? '' : '',
				user: user,
				content: node.content ? {
					text: node.content,
					format: node.content_format,
				} : null,
				lastReply: node.latest_reply_time ? dateUtils.formatDateTime(node.latest_reply_time) : null,
				users: ptUsersMap.get(node.id) ?? [],
				permissions: permissions,
				latestPage: latestPage,
				latestPost: latestPost,
				replyCount: replies,
				unread: userId && isThread ? hasLastChecked ? latestPost && latestPost > 0 ? true : false : node.locked ? false : true : false,
				unreadTotal: isThread ? unreadTotal : null,
				files: nodeFiles.map(file => ({
					id: file.id,
					fileId: file.file_id,
					name: file.name,
					width: file.width,
					height: file.height,
					caption: file.caption,
				})),
				showImages: userSettings && userSettings[0] ? userSettings[0].show_images : false,
				conciseMode: conciseMode,
				userDonations: isThread ? donationMap.get(node.user_id) ?? {} : {},
				forumCategory: forumCategory,
				nodeQuotes: nodeQuotes,
				reactions: nodeReactions,
				hidePostEmojis: userSettings && userSettings[0] ? userSettings[0].hide_post_emojis : false,
				polls: revPolls ? [...revPolls.values()] : [],
			};
		});

	return [count, childNodes];
}

/*
 * Check whether given text contains a filtered word.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function profanityCheck(text: any): Promise<void>
{
	if (text === null || utils.realStringLength(text) === 0)
	{
		return;
	}

	const words: [{ word: string }] = await query(`
		SELECT word
		FROM filter_word
		WHERE active = true
	`);

	// strip of all punctuation first
	const removePunctuation = /[.,!;:–—?]/g;

	text = text.replaceAll(removePunctuation, '');

	const startsWith = '(^|\\s)';
	const endsWith = '(?=\\s|$)';

	const filteredWords = words.filter(fw =>
	{
		const noWildCardWord = fw.word.replaceAll('*', '');

		// checks for (example): hell, *hell, hell*, *hell*
		if (
			fw.word.startsWith('*') && fw.word.endsWith('*') && text.match(RegExp(noWildCardWord, 'i')) ||
			fw.word.startsWith('*') && text.match(RegExp(`${noWildCardWord}${endsWith}`, 'i')) ||
			fw.word.endsWith('*') && text.match(RegExp(`${startsWith}${noWildCardWord}`, 'i')) ||
			!(fw.word.startsWith('*') || fw.word.endsWith('*')) && text.match(RegExp(`${startsWith}${noWildCardWord}${endsWith}`, 'i'))
		)
		{
			return fw;
		}
	});

	if (filteredWords.length > 0)
	{
		const uniqueWords = [...new Set(filteredWords.map(fw => fw.word.replaceAll('*', '')))];
		throw new ProfanityError(uniqueWords.join(', '));
	}
}

/*
 * Logs out all sessions belonging to the provided user ID.
 */
export async function logout(userId: number): Promise<void>
{
	await query("DELETE FROM session WHERE (sess->'user')::text = $1::text", userId);
}
