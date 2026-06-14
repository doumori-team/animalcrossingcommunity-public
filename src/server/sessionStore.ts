'use strict';

import connectPgSimple from 'connect-pg-simple';
import expressSession from 'express-session';
import pg from 'pg';

const { types } = pg;

// fix node-pg default transformation for date types
types.setTypeParser(types.builtins.DATE, (str: string) => str);

const isProd = process.env.NODE_ENV === 'production';

export const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL,
	...isProd && {
		max: 40,
		idleTimeoutMillis: 30000,
		min: 5,
		connectionTimeoutMillis: 15000,
		keepAlive: true,
	},
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isConnectionError(err: any)
{
	if (!err)
	{
		return false;
	}

	const msg = err.message || '';

	return (
		msg.includes('Connection terminated unexpectedly') ||
		msg.includes('Connection terminated due to connection timeout') ||
		msg.includes('ECONNRESET') ||
		msg.includes('terminating connection') ||
		msg.includes('Connection ended unexpectedly') ||
		msg.includes('server closed the connection unexpectedly') ||
		msg.includes('Connection closed unexpectedly')
	);
}

pool.on('error', (err) =>
{
	if (isConnectionError(err))
	{
		console.warn('Postgres idle connection closed');
		return;
	}

	console.error('Error, unexpected postgres error', err);
});

export const sessionStore = new (connectPgSimple(expressSession))({ pool, disableTouch: true });
