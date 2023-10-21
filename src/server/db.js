'use strict';

import connectPgSimple from 'connect-pg-simple';
import expressSession from 'express-session';
import pg from 'pg';

import { dateUtils } from '@utils';

const { types } = pg;

// fix node-pg default transformation for date types
types.setTypeParser(types.builtins.DATE, str => str);

const pool = new pg.Pool(
{
	connectionString: process.env.DATABASE_URL,
	ssl: {rejectUnauthorized: false} // Heroku self-signs its database SSL certificates
});

export const sessionStore = new (connectPgSimple(expressSession))({pool});

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

/* Logs out all sessions belonging to the provided user ID.
 */
export async function logout(userID)
{
	return await query("DELETE FROM session WHERE (sess->'user')::text = $1::text", userID);
}