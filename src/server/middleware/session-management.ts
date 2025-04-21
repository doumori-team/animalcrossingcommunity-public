import expressSession from 'express-session';

import * as db from '@db';

/* 
 * Connect session manager to automatically-created table in the database
 */
export default expressSession(
	{
		store: db.sessionStore,
		resave: false,
		secret: process.env.COOKIE_SECRET || 'keyboard cat',
		saveUninitialized: false,
		cookie: {
			// milliseconds; 7 days
			maxAge: 7 * 24 * 60 * 60 * 1000,
		},
	});
