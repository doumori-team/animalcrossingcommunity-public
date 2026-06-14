import expressSession from 'express-session';

import { sessionStore } from 'server/sessionStore.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const accCookie: any = {
	// milliseconds; 7 days
	maxAge: 7 * 24 * 60 * 60 * 1000,
	httpOnly: true,
	secure: process.env.APP_NAME !== 'acc-local',
};

if (process.env.APP_NAME !== 'acc-local')
{
	accCookie.sameSite = 'none';
}

/* 
 * Connect session manager to automatically-created table in the database
 */
export default expressSession(
	{
		store: sessionStore,
		resave: false,
		secret: process.env.COOKIE_SECRET || 'keyboard cat',
		saveUninitialized: false,
		cookie: accCookie,
	});
