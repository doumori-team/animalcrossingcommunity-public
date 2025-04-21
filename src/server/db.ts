'use strict';

import connectPgSimple from 'connect-pg-simple';
import expressSession from 'express-session';
import pg from 'pg';

import * as crypto from 'crypto';

import { dateUtils, constants, utils } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, UserLiteType, UserType, NodeChildNodesType, NodeChildrenResultType } from '@types';
import { ProfanityError } from '@errors';

const { types } = pg;

// fix node-pg default transformation for date types
types.setTypeParser(types.builtins.DATE, (str: string) => str);

const pool = new pg.Pool(
	{
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }, // Heroku self-signs its database SSL certificates
	});

export const sessionStore = new (connectPgSimple(expressSession))({ pool, disableTouch: true });

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
export async function query(sql: string, ...params: any[]): Promise<any>
{
	const result = await pool.query(sql, params);
	return result.rows;
}

export async function cacheQuery(method: string, sql: string, ...params: any[]): Promise<any>
{
	const cacheKey = `${method}_sql_${crypto.createHash('sha1').update(sql + params.toString()).digest('hex')}`;

	return await ACCCache.get(cacheKey, async () =>
	{
		return (await pool.query(sql, params)).rows;
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
export async function transaction(operate: Function): Promise<any>
{
	const client = await pool.connect();
	let returnVal;

	try
	{
		await client.query('BEGIN');
		returnVal = await operate(
			async function (sql: string, ...params: any[])
			{
				const result = await client.query(sql, params);
				return result.rows;
			},
		);
		await client.query('COMMIT');
	}
	catch (error)
	{
		await client.query('ROLLBACK');
		throw error;
	}
	finally
	{
		client.release();
	}

	return returnVal;
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
	const [[totalBellsCur], [missedBellsCur], [totalJackpotBellsCur], [jackpotsFoundCur], [jackpotsMissedCur], topBellsLatest, topBellsLastJackpot] = await Promise.all([
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2) AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId, constants.bellThreshold),
		query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND redeemed_user_id = user_id AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
		`, userId),
		query(`
			SELECT count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND type = 'jackpot' AND offer >= (SELECT updated FROM site_setting WHERE id = 4)
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

export async function getLatestPage(nodeId: number | string, userId: number): Promise<any[]>
{
	return query(`
		SELECT
			CEIL((
				SELECT count(*)+(
					SELECT count(*)
					FROM (
						SELECT node.id
						FROM node
						WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
						LIMIT 1
					) AS at_least_one_unread
				) AS count
				FROM node
				WHERE node.parent_node_id = $1 AND node.creation_time < last_checked
			) / $3::float) AS latest_page
		FROM (
			SELECT last_checked
			FROM node_user
			WHERE node_id = $1 AND user_id = $2
		) AS last_checked
	`, nodeId, userId, constants.threadPageSize);
}

export async function getLatestPost(nodeId: number | string, userId: number): Promise<any[]>
{
	return query(`
		SELECT
			(
				SELECT node.id
				FROM node
				WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
				ORDER BY node.creation_time ASC
				LIMIT 1
			) AS latest_post
		FROM (
			SELECT last_checked
			FROM node_user
			WHERE node_id = $1 AND user_id = $2
		) AS last_checked
	`, nodeId, userId);
}

export async function getChildren(resultsQuery: any, thisQuery: APIThisType['query'], userId: APIThisType['userId'], parentChildren = false): Promise<[number, NodeChildNodesType[]]>
{
	const [results, viewFollowersPerm, userSettings] = await Promise.all([
		resultsQuery,
		thisQuery('v1/permission', { permission: 'view-followers' }),
		userId ? query(`
			SELECT show_images, concise_mode
			FROM users
			WHERE id = $1::int
		`, userId) : null,
	]);

	const conciseMode: number = userSettings && userSettings[0] ? Number(userSettings[0].concise_mode) : 2;

	// A combination of what node/full does but faster
	const nodes = await Promise.all(
		results.map(async (node: NodeChildrenResultType) =>
		{
			return Promise.all([
				node,
				node.type === 'thread' ? query(`
					SELECT title
					FROM node_revision
					WHERE node_id = $1::int
					ORDER BY time DESC
					LIMIT 1
				`, node.parent_node_id) : null,
				node.user_id ? node.type === 'thread' ?
					thisQuery('v1/user_lite', { id: node.user_id }) :
					thisQuery('v1/user', { id: node.user_id }) : null,
				[constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(Number(node.parent_node_id)) ? query(`
					SELECT
						user_account_cache.id,
						user_account_cache.username,
						user_node_permission.granted
					FROM user_account_cache
					JOIN user_node_permission ON (user_node_permission.user_id = user_account_cache.id)
					WHERE user_node_permission.node_id = $1::int AND user_node_permission.node_permission_id = $2
					ORDER BY username ASC
				`, node.id, constants.nodePermissions.read) : null,
				['board', 'thread'].includes(node.type) ? query(`
					SELECT node_id
					FROM followed_node
					WHERE node_id = $1::int AND user_id = $2::int
				`, node.id, userId) : null,
				viewFollowersPerm && node.type === 'thread' && constants.boardIds.privateThreads !== Number(node.id) ? query(`
					SELECT count(*) AS count
					FROM followed_node
					WHERE node_id = $1::int
				`, node.id) : null,
				node.type === 'post' ? query(`
					SELECT count(*) AS count
					FROM node_revision
					WHERE node_id = $1::int
				`, node.id) : null,
				node.type === 'post' ? thisQuery('v1/node/permission', { permission: 'edit', nodeId: node.id }) : null,
				node.type === 'thread' && userId ? getLatestPage(node.id, userId) : null,
				node.type === 'thread' && userId ? getLatestPost(node.id, userId) : null,
				node.type === 'thread' ? query(`
					SELECT last_checked
					FROM node_user
					WHERE node_id = $1 AND user_id = $2
				`, node.id, userId) : [],
				node.type === 'thread' ? thisQuery('v1/node/permission', { permission: 'lock', nodeId: node.id }) : null,
				node.type === 'thread' && userId ? query(`
					SELECT
						(
							SELECT count(*) AS count
							FROM node
							WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
						) AS count
					FROM (
						SELECT last_checked
						FROM node_user
						WHERE node_id = $1 AND user_id = $2
					) AS last_checked
				`, node.id, userId) : null,
				node.type === 'post' ? query(`
					SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
					FROM node_revision_file
					JOIN file ON (node_revision_file.file_id = file.id)
					WHERE node_revision_file.node_revision_id = $1::int
					ORDER BY file.sequence ASC
				`, node.revision_id) : null,
				node.type === 'thread' ? thisQuery('v1/users/donations', { id: node.user_id }) : {},
				!parentChildren && ['board', 'thread'].includes(node.type) ? thisQuery('v1/node/permission', { permission: 'read', nodeId: node.id }) : true,
				node.type === 'board' ? query(`
					SELECT nc.id, nc.title, ncl.order
					FROM node_category nc
					INNER JOIN node_category_link ncl ON nc.id = ncl.category_id
					WHERE ncl.node_id = $1::int
					LIMIT 1
				`, node.id) : null,
			]);
		}),
	);

	if (!parentChildren)
	{
		// in case followed / threads has bad permission logic
		nodes
			.filter(result => !result[15])
			.map(result =>
			{
				console.error(`getChildren for ${userId}, permission read error for node ${result[0].id}`);
			});
	}

	const count = results.length > 0 ? Number(results[0].count) : 0;

	// we should essentially be returning the same thing as node/full here
	// exception is node permissions, which we don't need to get for each child (only posts)
	return [count, nodes
		.filter(result => result[15]) // can read node
		.map(result =>
		{
			const node: NodeChildrenResultType = result[0];
			const parent = result[1];
			const user: UserLiteType | UserType | null = result[2];
			const users = result[3];

			let followedNode, numFollowed;

			if (['board', 'thread'].includes(node.type))
			{
				[followedNode] = result[4];

				if (viewFollowersPerm && node.type === 'thread' && constants.boardIds.privateThreads !== Number(node.id))
				{
					[numFollowed] = result[5];
				}
			}

			const revisions = result[6];
			const editPerm: boolean | null = result[7];
			const latestPage = result[8] && result[8][0] ? result[8][0].latest_page : null;
			const latestPost = result[9] && result[9][0] ? result[9][0].latest_post : null;
			const lastChecked = result[10];
			const lockPerm: boolean | null = result[11];

			let permissions: string[] = [];

			if (editPerm)
			{
				permissions.push('edit');
			}

			if (lockPerm)
			{
				permissions.push('lock');
			}

			const unreadTotal = result[12];
			const nodeFiles = result[13];
			const userDonations = result[14];
			const forumCategory = result[15];

			const replies = node.reply_count ? Number(node.reply_count) - 1 : 0;

			return <NodeChildNodesType>{
				id: Number(node.id),
				type: node.type,
				parentId: Number(node.parent_node_id),
				revisionId: Number(node.revision_id),
				title: node.title,
				created: node.creation_time,
				formattedCreated: dateUtils.formatDateTime(node.creation_time),
				locked: node.locked,
				threadType: node.thread_type,
				edits: revisions ? revisions[0].count - 1 : 0,
				followed: followedNode ? true : false,
				numFollowed: viewFollowersPerm && numFollowed ? Number(numFollowed.count) : 0,
				board: parent ? parent[0].title : '',
				user: user,
				content: node.content ? {
					text: node.content,
					format: node.content_format,
				} : null,
				lastReply: node.latest_reply_time ? dateUtils.formatDateTime(node.latest_reply_time) : null,
				users: users,
				permissions: permissions,
				latestPage: latestPage,
				latestPost: latestPost,
				replyCount: replies,
				unread: userId && node.type === 'thread' ? lastChecked.length > 0 ? latestPost > 0 ? true : false : node.locked ? false : true : false,
				unreadTotal: unreadTotal ? unreadTotal[0] ? Number(unreadTotal[0].count) : replies + 1 : null,
				files: nodeFiles ? nodeFiles.map((file: any) =>
				{
					return {
						id: file.id,
						fileId: file.file_id,
						name: file.name,
						width: file.width,
						height: file.height,
						caption: file.caption,
					};
				}) : [],
				showImages: userSettings && userSettings[0] ? userSettings[0].show_images : false,
				conciseMode: conciseMode,
				userDonations: userDonations,
				forumCategory: forumCategory,
			};
		})];
}

/*
 * Check whether given text contains a filtered word.
 */
export async function profanityCheck(text: any): Promise<void>
{
	if (text === null || utils.realStringLength(text) === 0)
	{
		return;
	}

	const words = await query(`
		SELECT word
		FROM filter_word
		WHERE active = true
	`);

	// strip of all punctuation first
	const removePunctuation = /[.,!;:–—?]/g;

	text = text.replaceAll(removePunctuation, '');

	const startsWith = '(^|\\s)';
	const endsWith = '(?=\\s|$)';

	const filteredWords = words.filter((fw: any) =>
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
		const uniqueWords = [...new Set(filteredWords.map((fw: any) => fw.word.replaceAll('*', '')))];
		throw new ProfanityError(uniqueWords.join(', '));
	}
}

/* 
 * Logs out all sessions belonging to the provided user ID.
 */
export async function logout(userId: string): Promise<void>
{
	await query("DELETE FROM session WHERE (sess->'user')::text = $1::text", userId);
}
