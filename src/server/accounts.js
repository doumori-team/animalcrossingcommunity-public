// Interface for reacting with the accounts site.
import url from 'url';
import request from 'request';
import * as errors from 'common/errors.js';

const AccountsError = errors.AccountsError;
const UserError = errors.UserError;

import * as db from '@db';
import { dateUtils } from '@utils';

const consumer_key = (process.env.ACCOUNTS_API_KEY || '');
const host = 'https://accounts.animalcrossingcommunity.com/';

// Generates a request token that uniquely identifies a login transaction.
// callback: Wherever the user should come back to after logging in. Probably
//    looks something like this:
//    https://animalcrossingcommunity.com/auth/ready?redirect_to=/wherever/the/user/was/before
// Returns a URL to the login form, with the request token prefilled.
export async function initiate(callback)
{
	let response, body;
	try
	{
		[response, body] = await httpPost({
			url: new url.URL('/initiate', host),
			form: {consumer_key, callback}
		})
	}
	catch (error)
	{
		throw new AccountsError('initiate', error)
	}

	switch(response.statusCode)
	{
		case 200: // OK
			const token = JSON.parse(body).token;
			const authorizeUrl = new url.URL('/authorize', host);
			authorizeUrl.searchParams.set('token', token);
			return authorizeUrl.href;
		case 401: // Unauthorized
			throw new AccountsError('initiate', 'invalid api key', 401);
		default:
			throw new AccountsError('initiate', 'unexpected http status code', response.statusCode);
	}
}

// Generates an access token confirming a user's identity. The access token
// should be stored in the database and its validity checked regularly to ensure
// the user's login hasn't expired.
// token: Request token generated in initiate() above
// verifier: Verifier sent to the callback URL (/auth/ready) after login
// Returns an object with the keys:
//	- token: the access token (string)
//  - id: user's unique numeric ID (primary key for user table) (number)
//  - username (string)
//  - signup_date: date user created their account (Date)
export async function getToken(token, verifier)
{
	let response, body;
	try
	{
		[response, body] = await httpPost({
			url: new url.URL('/token', host),
			form: {consumer_key, token, verifier}
		});
	}
	catch (error)
	{
		throw new AccountsError('token', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return JSON.parse(body);
		case 401: // Unauthorized
			/* NOTE TO FUTURE DEBUGGERS:
				* There are four possible causes of this error:
				* - The API key above ('consumer_key') is invalid. This is
				*   fairly easy to identify because all logins will be failing
				*   and everyone will have been logged out.
				* - The user took almost exactly 60 minutes to fill in the login
				*   form, so that the 60-minute expiry time had not passed yet
				*   when she clicked "Log in", but _had_ by the time this code
				*   was reached. This is highly unlikely.
				* - The user is running a browser extension that is interfering
				*   with the login process. This is most likely the case if the
				*   user complains about the problem to Support. This is most
				*   likely to be caused by auto-HTTPS extensions like "Smart
				*   HTTPS" and "HTTPS Everywhere", and can usually be fixed by
				*   tweaking the extension's settings.
				* - The user is malicious and trying to find an exploit. Take
				*   this seriously, especially if it occurs multiple times.
				*   An administrator should consult server logs for an IP
				*   address and try to find any other attack vectors that may
				*   have been attempted.
				*/
			throw new AccountsError('token', 'request verifier rejected!! (important!)', 401);
		default:
			throw new AccountsError('token', 'unexpected http status code', response.statusCode);
	}
}

// Checks whether an access token is still valid. Returns true or false.
export async function checkToken(token)
{
	let response, body;
	try
	{
		[response, body] = await httpPost({
			url: new url.URL('/token/check', host),
			form: {consumer_key, token}
		});
	}
	catch(error)
	{
		throw new AccountsError('token/check', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return JSON.parse(body).valid;
		default:
			throw new AccountsError('token/check', 'unexpected http status code', response.statusCode);
	}
}

// Queries for information about a user. Specify either ID or username (case-insensitive).
// If searching by username, I recommend using the helper function getDataByUsername()
//     to avoid having to manually specify a falsey value for the ID.
// Returns an object with the keys:
//  - id: user's unique numeric ID (primary key for user table) (number)
//  - username (string)
//  - signup_date: date user created their account (Date)
export async function getData(id, username)
{
	if ([0, undefined].includes(id) && username === undefined)
	{
		throw new UserError('no-such-user');
	}

	// Check to see if we already have a cached result
	let results;
	if (id)
	{
		results = await db.query('SELECT * FROM user_account_cache WHERE id = $1::int', id);
	}
	else
	{
		results = await db.query('SELECT * FROM user_account_cache WHERE username = $1::text', username);
	}

	// make test-new-member a new member
	if (results.length > 0 && results[0].id === 840408 && !dateUtils.isNewMember(results[0].signup_date))
	{
		results = await db.query(`
			UPDATE user_account_cache
			SET signup_date = now()
			WHERE id = $1::int
			RETURNING id, username, signup_date, last_update
		`, results[0].id);
	}

	// If there is a recent cached result, return it and disregard the rest of the function
	if (results.length > 0)
	{
		const {id, username, signup_date} = results[0];
		return {id, username, signup_date};
	}

	// We haven't got a result, so fetch one afresh from the accounts website
	return (await getUserData(id, username));
}

// Grabs birth date for user.
// Returns a Date object
export async function getBirthDate(id)
{
	const userData = await getUserData(id);

	return dateUtils.dateToDate(
		userData.birth_date.year,
		userData.birth_date.month-1,
		userData.birth_date.day,
	);
}

// Get birthdays for current date.
// Returns array of ids & usernames.
export async function getBirthdays()
{
	const dataUrl = new url.URL('/birthdays', host);
	dataUrl.searchParams.set('consumer_key', consumer_key);

	let response, body;

	try
	{
		[response, body] = await httpGet({url: dataUrl});
	}
	catch(error)
	{
		throw new AccountsError('GET birthdays', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return (JSON.parse(body));
		case 401: // Unauthorized
			throw new AccountsError('GET birthdays', 'invalid api key', 401);
		default:
			throw new AccountsError('GET birthdays', 'unexpected http status code', response.statusCode);
	}
}

// Calls accounts website.
// Returns an object with the keys:
//  - id: user's unique numeric ID (primary key for user table) (number)
//  - username (string)
//  - email (string)
//  - signup_date: date user created their account (Date)
//  - birth_date: object w/day, month & year (object)
//  - address: user address (string)
export async function getUserData(id, username, email)
{
	const dataUrl = new url.URL('/data', host);
	dataUrl.searchParams.set('consumer_key', consumer_key);
	dataUrl.searchParams.set('id', id);

	if (username != null)
	{
		dataUrl.searchParams.set('username', username);
	}

	if (email != null)
	{
		dataUrl.searchParams.set('email', email);
	}

	let response, body;

	try
	{
		[response, body] = await httpGet({url: dataUrl});
	}
	catch(error)
	{
		throw new AccountsError('GET data', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			const userData = (JSON.parse(body));
			await db.updateAccountCache(userData); // We have data, so let's update the cache
			return userData;
		case 400: // Bad Request
			throw new AccountsError('GET data', `user ID '${id}' is not numeric`, 400);
		case 401: // Unauthorized
			throw new AccountsError('GET data', 'invalid api key', 401);
		case 404: // Not Found
			// Delete any cached data about user in case they _used_ to exist
			await db.query('DELETE FROM user_account_cache WHERE id = $1::int', id);

			throw new UserError('no-such-user');
		default:
			throw new AccountsError('GET data', 'unexpected http status code', response.statusCode);
	}
}

export async function getDataByUsername(username)
{
	return await getData(undefined, username);
}

// Updates information about a user
// userData: An object with properties:
//   user_id - self-explanatory
//   username - self-explanatory
//   birth_date_day - indexed from 1, self-explanatory
//   birth_date_month - indexed from 1, self-explanatory
//   birth_date_year - self-explanatory
//   email - self-explanatory
export async function pushData(userData)
{
	let response;
	try
	{
		[response] = await httpPost({
			url: new url.URL('/data', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST data', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			if (userData.hasOwnProperty('username'))
			{
				await db.query(`
					UPDATE user_account_cache
					SET username = $2, last_update = now()
					WHERE id = $1
				`, userData.user_id, userData.username);
			}

			return;
		case 400: // Bad Request
			throw new AccountsError('POST data', 'invalid user email or date of birth', 400);
		case 401: // Unauthorized
			throw new AccountsError('POST data', 'invalid api key', 401);
		case 404: // Not Found
			throw new AccountsError('POST data', `user ID '${id}' does not exist`, 404);
		case 409: // Duplicate username or email
			throw new AccountsError('POST data', 'username or email already in use', 409);
		default:
			throw new AccountsError('POST data', 'unexpected http status code', response.statusCode);
	}
}

// Creates new account
export async function signup(userData)
{
	let response, body;
	try
	{
		[response, body] = await httpPost({
			url: new url.URL('/signup', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST signup', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			const userData = (JSON.parse(body));
			await db.updateAccountCache(userData);
			return userData;
		case 400: // Bad Request
			console.error(userData);
			throw new AccountsError('POST data', 'invalid user email or date of birth', 400);
		default:
			console.error(userData);
			throw new AccountsError('POST signup', 'unexpected http status code', response.statusCode);
	}
}

// Delete account
export async function deleteUser(id)
{
	let userData = {
		id: id
	};

	let response;
	try
	{
		[response] = await httpPost({
			url: new url.URL('/delete-user', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST delete-user', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			await db.query('DELETE FROM user_account_cache WHERE id = $1::int', id);
			await db.query('DELETE FROM users WHERE id = $1::int', id);
			return;
		default:
			throw new AccountsError('POST delete-user', 'unexpected http status code', response.statusCode);
	}
}

// Updates user address
// userData: An object with properties:
//   user_id - self-explanatory
//   address - self-explanatory
export async function updateAddress(userData)
{
	let response;
	try
	{
		[response] = await httpPost({
			url: new url.URL('/address', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST address', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('POST address', 'invalid api key', 401);
		default:
			throw new AccountsError('POST address', 'unexpected http status code', response.statusCode);
	}
}

// Reset username history, for test accounts only
export async function resetUsernameHistory(id)
{
	let response;

	const userData = {
		user_id: id,
	};

	try
	{
		[response] = await httpPost({
			url: new url.URL('/reset-username-history', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST reset-username-history', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return;
		case 400: // Bad Request
			throw new AccountsError('POST reset-username-history', 'production call to test api', 400);
		case 401: // Unauthorized
			throw new AccountsError('POST reset-username-history', 'invalid api key', 401);
		default:
			throw new AccountsError('POST reset-username-history', 'unexpected http status code', response.statusCode);
	}
}

// Delete username history row
export async function deleteUsernameHistory(id)
{
	let response;

	const userData = {
		username_history_id: id,
	};

	try
	{
		[response] = await httpPost({
			url: new url.URL('/delete-username-history', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST delete-username-history', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('POST delete-username-history', 'invalid api key', 401);
		default:
			throw new AccountsError('POST delete-username-history', 'unexpected http status code', response.statusCode);
	}
}

// Send email to user.
// emailData: An object with properties:
//   user - user_id
//   subject - self-explanatory
//   text - email body
export async function emailUser(emailData)
{
	let response;
	try
	{
		[response] = await httpPost({
			url: new url.URL('/email', host),
			form: {consumer_key, ...emailData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST email', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return;
		case 400: // Bad Request
			throw new AccountsError('POST email', 'invalid: user and email given', 401);
		case 401: // Unauthorized
			throw new AccountsError('POST email', 'invalid api key', 401);
		default:
			throw new AccountsError('POST email', 'unexpected http status code', response.statusCode);
	}
}

// Logs out the user with the given ID.
// (i.e. Invalidates all their access tokens.)
export async function logout(id)
{
	let response;
	try
	{
		[response] = await httpPost({
			url: new url.URL('/logout', host),
			form: {consumer_key, id}
		});
	}
	catch(error)
	{
		throw new AccountsError('logout', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('logout', 'invalid api key', 401);
		default:
			throw new AccountsError('logout', 'unexpected http status code', response.statusCode);
	}
}

// Get reset password url for user
//   id - who the password reset is for
export async function resetPassword(id)
{
	let response, body;

	const userData = {
		id: id,
	};

	try
	{
		[response, body] = await httpPost({
			url: new url.URL('/reset-password', host),
			form: {consumer_key, ...userData}
		});
	}
	catch(error)
	{
		throw new AccountsError('POST reset-password', error);
	}

	switch(response.statusCode)
	{
		case 200: // OK
			const data = (JSON.parse(body));
			return `${host}reset-password?token=${data.token}`;
		case 404: // Bad Request
			throw new AccountsError('POST reset-password', 'mismatch between site and account, production vs. test', 400);
		case 401: // Unauthorized
			throw new AccountsError('POST reset-password', 'invalid api key', 401);
		default:
			throw new AccountsError('POST reset-password', 'unexpected http status code', response.statusCode);
	}
}


// Wrappers around the default Node request.get() and request.post() functions
// so that they can be used as async functions.

function httpGet(options)
{
	return new Promise((resolve, reject) =>
	{
		request.get(options, (error, response, body) =>
		{
			if (error)
			{
				return reject(error);
			}

			return resolve([response, body]);
		});
	});
}

function httpPost(options)
{
	return new Promise((resolve, reject) =>
	{
		request.post(options, (error, response, body) =>
		{
			if (error)
			{
				return reject(error);
			}

			return resolve([response, body]);
		});
	});
}