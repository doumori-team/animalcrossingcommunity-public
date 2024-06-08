import { URL } from 'url';
import express from 'express';

import * as accounts from '@accounts';
import * as db from '@db';
import * as iso from 'common/iso.js';
import { dateUtils } from '@utils';

const handler = express();
handler.set('views', new URL('../views', import.meta.url).pathname);

/* Express route for handling GET requests to /auth/go.
 * When the user navigates to this page, they are redirected to the login
 * form on the accounts site.
 */
handler.get('/go', (request, response, next) =>
{
	response.set('Cache-Control', 'no-store');

	const host = request.protocol + '://' + request.get('host');
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
handler.get('/ready', (request, response, next) =>
{
	response.set('Cache-Control', 'no-store');

	accounts.getToken(request.query.token, request.query.verifier)
	.then(db.updateAccountCache)
	.then(async details =>
	{
		request.session.user = details.id;

		const [user] = await db.query(`
			SELECT
				users.last_active_time,
				user_account_cache.signup_date,
				user_account_cache.username
			FROM users
			JOIN user_account_cache ON (user_account_cache.id = users.id)
			WHERE users.id = $1
		`, details.id);

		request.session.username = user.username;

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
 *
 * Copy in api-requests.
 */
handler.post('/logout', (request, response, next) =>
{
	response.set('Cache-Control', 'no-store');

	let logoutProcess;

	if (request.session.user)
	{
		// the user is logged in: these are the steps needed to log them out.
		// logoutProcess will resolve when all the asynchronous steps have
		//   completed.
		const userID = request.session.user;
		delete request.session.user;
		delete request.session.username;

		logoutProcess = Promise.all(
		[
			accounts.logout(userID),
			db.logout(userID),
			iso.query(userID, 'v1/session/update', {
				url: 'logout'
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
handler.use((error, request, response, next) =>
{
	response.set('Cache-Control', 'no-store');

	console.log('Error handling login / logout:');
	console.error(error);

	response.status(500);
	response.render('500');
});

export default handler;
