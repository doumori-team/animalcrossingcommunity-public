'use strict';

import connectPgSimple from 'connect-pg-simple';
import expressSession from 'express-session';
import pg from 'pg';
import * as crypto from 'crypto';

import { dateUtils, constants } from '@utils';
import { ACCCache } from '@cache';

const { types } = pg;

// fix node-pg default transformation for date types
types.setTypeParser(types.builtins.DATE, str => str);

const pool = new pg.Pool(
{
	connectionString: process.env.DATABASE_URL,
	ssl: {rejectUnauthorized: false} // Heroku self-signs its database SSL certificates
});

export const sessionStore = new (connectPgSimple(expressSession))({pool, disableTouch: true});

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
export async function query(sql, ...params)
{
	const result = await pool.query(sql, params);
	return result.rows;
}

export async function cacheQuery(method, sql, ...params)
{
	const cacheKey = `${method}_sql_${crypto.createHash('sha1').update(sql + params.toString()).digest('hex')}`;

	return await ACCCache.get(cacheKey, async () => {
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
export async function transaction(operate)
{
	const client = await pool.connect();
	let returnVal;

	try
	{
		await client.query('BEGIN');
		returnVal = await operate(
			async function (sql, ...params)
			{
				const result = await client.query(sql, params)
				return result.rows;
			}
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
export async function updateAccountCache({id, username, signup_date})
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

	return {id, username, signup_date};
}

export async function updateThreadStats(nodeId)
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
export async function regenerateTopBells({userId})
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

export async function updatePTsLookup(nodeId)
{
	await transaction(async tranQuery =>
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

export async function updatePTsLookupMass(nodeIds)
{
	await transaction(async tranQuery =>
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

export async function getUserGroups(userId)
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

	return groupIds.map(gid => gid.id);
}

/* Logs out all sessions belonging to the provided user ID.
 */
export async function logout(userId)
{
	return await query("DELETE FROM session WHERE (sess->'user')::text = $1::text", userId);
}