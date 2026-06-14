import express, { Request, Response, NextFunction } from 'express';

import { URL } from 'url';

import * as accounts from '@accounts';
import * as db from '@db';
import { iso } from 'common/iso.ts';
import { dateUtils, constants } from '@utils';

const handler = express();

/* Express route for handling GET requests to /auth/go.
 * When the user navigates to this page, they are redirected to the login
 * form on the accounts site.
 */
handler.get('/go', (request, response, next) =>
{
	const hostHeader = request.headers['x-forwarded-host'] || request.get('host');
	response.set('Cache-Control', 'no-store');

	const host = request.protocol + '://' + hostHeader;
	const callbackUrl = new URL('/auth/ready', host);
	accounts.initiate(callbackUrl.href)
	.then(authorizeUrl => response.redirect(authorizeUrl))
	.catch(next);
});

/* Express route for handling GET requests to /auth/ready.
 * The user is redirected here after logging in at the accounts site, with
 * a verifier that we can use to check their user ID. When that is done we
 * redirect them to the homepage.
 * Their user ID can be retrieved as request.session.user later.
 */
handler.get('/ready', (request: Request, response: Response, next: NextFunction) =>
{
	response.set('Cache-Control', 'no-store');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	accounts.getToken((request as any).query.token, (request as any).query.verifier)
	.then(db.updateAccountCache)
	.then(async details =>
	{
		// you always have a session
		// this tells session-management to log it into the db
		// and associate it with a user
		request.session.user = details.id;

		const [user] = await db.query(`
			SELECT
				users.last_active_time,
				user_account_cache.signup_date,
				user_account_cache.username,
				users.stay_forever
			FROM users
			JOIN user_account_cache ON (user_account_cache.id = users.id)
			WHERE users.id = $1
		`, details.id);

		request.session.username = user.username;

		Promise.all([
			(await iso).query(request.session.user, 'v1/users/badge/check', { badgeId: constants.badges.seasons }),
			(await iso).query(request.session.user, 'v1/users/badge/check', { badgeId: constants.badges.oneyear }),
			(await iso).query(request.session.user, 'v1/users/badge/check', { badgeId: constants.badges.fiveyears }),
			(await iso).query(request.session.user, 'v1/users/badge/check', { badgeId: constants.badges.tenyears }),
			(await iso).query(request.session.user, 'v1/users/badge/check', { badgeId: constants.badges.twentyyears }),
		]);

		if (user.stay_forever)
		{
			request.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
		}

		(await iso).query(details.id, 'v1/session/update', {
			url: 'login',
		});

		if (user.last_active_time === null && dateUtils.isNewMember(user.signup_date))
		{
			response.redirect('/new-member');
		}
		else
		{
			response.redirect('/');
		}
	})
	.catch(next);
});

/* Express route for handling POST requests to /auth/logout.
 *
 * Logs out the user if they were logged in; then, if a _callback_uri parameter
 * is specified, redirects to that location.
 *
 * Restricting this to POST rather than GET is to help make prevention of CSRF
 * attacks easier in future. Note that this on its own does NOT fully protect
 * against CSRF (though it may dissuade a casual opportunist).
 * See: https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)#Only_accepting_POST_requests
 */
handler.post('/logout', async (request: Request, response: Response, next: NextFunction) =>
{
	response.set('Cache-Control', 'no-store');

	let logoutProcess;

	if (request.session.user)
	{
		const userId = request.session.user;

		// delete the session from the database
		request.session.destroy((err: unknown) =>
		{
			if (err)
			{
				return next(err);
			}

			// delete the cookie from the browser
			response.clearCookie('connect.sid');
		});

		logoutProcess = Promise.all([
			accounts.logout(userId),
			// remove any other instances of them being logged in
			db.logout(userId),
			(await iso).query(userId, 'v1/session/update', {
				url: 'logout',
			}),
		]);
	}
	else
	{
		// the user is not logged in: no action required -
		//   logoutProcess will resolve immediately.
		logoutProcess = Promise.resolve();
	}

	logoutProcess.then(() =>
	{
		response.redirect(303, '/');
	})
	.catch(next);
});

// Error handler
handler.use((error: unknown, request: Request, response: Response, _: NextFunction) =>
{
	response.set('Cache-Control', 'no-store');

	console.error('Error handling login / logout:', error);

	response.status(500);
});

export default handler;
