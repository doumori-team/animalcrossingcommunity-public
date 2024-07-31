// Interface for reacting with the accounts site.
import url from 'url';
import axios from 'axios';

import * as errors from 'common/errors.ts';

const AccountsError = errors.AccountsError;
const UserError = errors.UserError;

import * as db from '@db';
import { dateUtils } from '@utils';
import { AccountUserType, AccountUserLiteType } from '@types';

const consumer_key = (process.env.ACCOUNTS_API_KEY || '');
const host = 'https://accounts.animalcrossingcommunity.com/';

axios.defaults.validateStatus = () => {
    return true;
};

// Generates a request token that uniquely identifies a login transaction.
// callback: Wherever the user should come back to after logging in. Probably
//    looks something like this:
//    https://animalcrossingcommunity.com/auth/ready?redirect_to=/wherever/the/user/was/before
// Returns a URL to the login form, with the request token prefilled.
export async function initiate(callback: string) : Promise<string>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/initiate', host).toString(),
			new URLSearchParams({consumer_key, callback}),
		);
	}
	catch (error)
	{
		throw new AccountsError('initiate', error);
	}

	switch(response.status)
	{
		case 200: // OK
			const authorizeUrl = new url.URL('/authorize', host);
			authorizeUrl.searchParams.set('token', response.data.token);
			return authorizeUrl.href;
		case 401: // Unauthorized
			throw new AccountsError('initiate', 'invalid api key', 401);
		default:
			throw new AccountsError('initiate', 'unexpected http status code', response.status);
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
export async function getToken(token:string, verifier:string) : Promise<string & AccountUserType>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/token', host).toString(),
			new URLSearchParams({consumer_key, token, verifier})
		);
	}
	catch (error)
	{
		throw new AccountsError('token', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return response.data;
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
			throw new AccountsError('token', 'unexpected http status code', response.status);
	}
}

// Checks whether an access token is still valid. Returns true or false.
export async function checkToken(token:string) : Promise<boolean>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/token/check', host).toString(),
			new URLSearchParams({consumer_key, token})
		);
	}
	catch(error)
	{
		throw new AccountsError('token/check', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return response.data.valid;
		default:
			throw new AccountsError('token/check', 'unexpected http status code', response.status);
	}
}

// Queries for information about a user. Specify either ID or username (case-insensitive).
// If searching by username, I recommend using the helper function getDataByUsername()
//     to avoid having to manually specify a falsey value for the ID.
// Returns an object with the keys:
//  - id: user's unique numeric ID (primary key for user table) (number)
//  - username (string)
//  - signup_date: date user created their account (Date)
export async function getData(id?:number|null|string, username?:string) : Promise<AccountUserLiteType>
{
	if ((id == null || id == 0) && username === undefined)
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
	const userData = await getUserData(id, username);

	return <AccountUserLiteType>{
		id: userData.id,
		username: userData.username,
		signup_date: userData.signup_date
	}
}

// Grabs birth date for user.
// Returns a Date object
export async function getBirthDate(id?:number) : Promise<Date>
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
export async function getBirthdays() : Promise<{id: number, username: string}[]>
{
	const dataUrl = new url.URL('/birthdays', host);
	dataUrl.searchParams.set('consumer_key', consumer_key);

	let response;

	try
	{
		response = await axios.get(dataUrl.toString());
	}
	catch(error)
	{
		throw new AccountsError('GET birthdays', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return response.data;
		case 401: // Unauthorized
			throw new AccountsError('GET birthdays', 'invalid api key', 401);
		default:
			throw new AccountsError('GET birthdays', 'unexpected http status code', response.status);
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
export async function getUserData(id?:number|null|string, username?:string|null, email?:string|null) : Promise<AccountUserType>
{
	const dataUrl = new url.URL('/data', host);
	dataUrl.searchParams.set('consumer_key', consumer_key);
	dataUrl.searchParams.set('id', String(id || ''));

	if (username != null)
	{
		dataUrl.searchParams.set('username', username);
	}

	if (email != null)
	{
		dataUrl.searchParams.set('email', email);
	}

	let response;

	try
	{
		response = await axios.get(dataUrl.toString());
	}
	catch(error)
	{
		throw new AccountsError('GET data', error);
	}

	switch(response.status)
	{
		case 200: // OK
			const userData = response.data;
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
			throw new AccountsError('GET data', 'unexpected http status code', response.status);
	}
}

export async function getDataByUsername(username:string) : Promise<AccountUserLiteType>
{
	return await getData(undefined, username);
}

// Updates information about a user
// userData: An object with properties:
export async function pushData(userData: {
	user_id: string|number
	username?: string
	email?: string|null
	ignore_history?: boolean
	consent_given?: boolean
}) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/data', host).toString(),
			new URLSearchParams({consumer_key, ...userData} as any)
		);
	}
	catch(error)
	{
		throw new AccountsError('POST data', error);
	}

	switch(response.status)
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
			throw new AccountsError('POST data', `user ID '${userData.user_id}' does not exist`, 404);
		case 409: // Duplicate username or email
			throw new AccountsError('POST data', 'username or email already in use', 409);
		default:
			throw new AccountsError('POST data', 'unexpected http status code', response.status);
	}
}

// Creates new account
export async function signup(userData: {
	username: string
	birth_date_day: number
	birth_date_month: number
	birth_date_year: number
	email?: string
	consent_given: boolean
}) : Promise<AccountUserType>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/signup', host).toString(),
			new URLSearchParams({consumer_key, ...userData} as any)
		);
	}
	catch(error)
	{
		throw new AccountsError('POST signup', error);
	}

	switch(response.status)
	{
		case 200: // OK
			const userData = response.data;
			await db.updateAccountCache(userData);
			return userData;
		case 400: // Bad Request
			console.error(userData);
			throw new AccountsError('POST data', 'invalid user email or date of birth', 400);
		default:
			console.error(userData);
			throw new AccountsError('POST signup', 'unexpected http status code', response.status);
	}
}

// Delete account
export async function deleteUser(id: number) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/delete-user', host).toString(),
			new URLSearchParams({consumer_key, id: String(id)})
		);
	}
	catch(error)
	{
		throw new AccountsError('POST delete-user', error);
	}

	switch(response.status)
	{
		case 200: // OK
			await db.query('DELETE FROM user_account_cache WHERE id = $1::int', id);
			await db.query('DELETE FROM users WHERE id = $1::int', id);
			return;
		default:
			throw new AccountsError('POST delete-user', 'unexpected http status code', response.status);
	}
}

// Updates user address
// userData: An object with properties:
//   user_id - self-explanatory
//   address - self-explanatory
export async function updateAddress(userData: {
	user_id: number
	address: string
}) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/address', host).toString(),
			new URLSearchParams({consumer_key, ...userData} as any)
		);
	}
	catch(error)
	{
		throw new AccountsError('POST address', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('POST address', 'invalid api key', 401);
		default:
			throw new AccountsError('POST address', 'unexpected http status code', response.status);
	}
}

// Reset username history, for test accounts only
export async function resetUsernameHistory(id:number) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/reset-username-history', host).toString(),
			new URLSearchParams({consumer_key, user_id: String(id)})
		);
	}
	catch(error)
	{
		throw new AccountsError('POST reset-username-history', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return;
		case 400: // Bad Request
			throw new AccountsError('POST reset-username-history', 'production call to test api', 400);
		case 401: // Unauthorized
			throw new AccountsError('POST reset-username-history', 'invalid api key', 401);
		default:
			throw new AccountsError('POST reset-username-history', 'unexpected http status code', response.status);
	}
}

// Delete username history row
export async function deleteUsernameHistory(id:number) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/delete-username-history', host).toString(),
			new URLSearchParams({consumer_key, username_history_id: String(id)})
		);
	}
	catch(error)
	{
		throw new AccountsError('POST delete-username-history', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('POST delete-username-history', 'invalid api key', 401);
		default:
			throw new AccountsError('POST delete-username-history', 'unexpected http status code', response.status);
	}
}

// Send email to user.
// emailData: An object with properties:
//   user - user_id
//   subject - self-explanatory
//   text - email body
export async function emailUser(emailData: {
	user?: number
	subject: string
	text: string
	email?: string
}) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/email', host).toString(),
			new URLSearchParams({consumer_key, ...emailData} as any)
		);
	}
	catch(error)
	{
		throw new AccountsError('POST email', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return;
		case 400: // Bad Request
			throw new AccountsError('POST email', 'invalid: user and email given', 401);
		case 401: // Unauthorized
			throw new AccountsError('POST email', 'invalid api key', 401);
		default:
			throw new AccountsError('POST email', 'unexpected http status code', response.status);
	}
}

// Logs out the user with the given ID.
// (i.e. Invalidates all their access tokens.)
export async function logout(id:number) : Promise<void>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/logout', host).toString(),
			new URLSearchParams({consumer_key, id: String(id)})
		);
	}
	catch(error)
	{
		throw new AccountsError('logout', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return;
		case 401: // Unauthorized
			throw new AccountsError('logout', 'invalid api key', 401);
		default:
			throw new AccountsError('logout', 'unexpected http status code', response.status);
	}
}

// Get reset password url for user
//   id - who the password reset is for
export async function resetPassword(id:number) : Promise<string>
{
	let response;

	try
	{
		response = await axios.post(
			new url.URL('/reset-password', host).toString(),
			new URLSearchParams({consumer_key, id: String(id)})
		);
	}
	catch(error)
	{
		throw new AccountsError('POST reset-password', error);
	}

	switch(response.status)
	{
		case 200: // OK
			return `${host}reset-password?token=${response.data.token}`;
		case 404: // Bad Request
			throw new AccountsError('POST reset-password', 'mismatch between site and account, production vs. test', 400);
		case 401: // Unauthorized
			throw new AccountsError('POST reset-password', 'invalid api key', 401);
		default:
			throw new AccountsError('POST reset-password', 'unexpected http status code', response.status);
	}
}