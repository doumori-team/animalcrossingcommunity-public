import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import * as db from '@db';
import { APIThisType, SuccessType } from '@types';

async function signup(this: APIThisType, {username, email, birthday, ipAddresses}: signupProps) : Promise<SuccessType>
{
	if (this.userId)
	{
		throw new UserError('permission');
	}

	if (!username.match(RegExp(constants.regexes.nonWhitespaceCharacters)))
	{
		throw new UserError('bad-format');
	}

	// Check if username is taken

	try
	{
		await accounts.getUserData(null, username);

		throw new UserError('username-taken');
	}
	catch (error:any)
	{
		if (error.name === 'UserError' && error.identifiers.includes('no-such-user'))
		{
			// it's supposed to error because no user found with that username, we can continue
		}
		else
		{
			// Not this function's problem then, so pass it on.
			throw error;
		}
	}

	// Check if email is used

	try
	{
		await accounts.getUserData(null, null, email);

		throw new UserError('email-taken');
	}
	catch (error:any)
	{
		if (error.name === 'UserError' && error.identifiers.includes('no-such-user'))
		{
			// it's supposed to error because no user found with that email, we can continue
		}
		else
		{
			// Not this function's problem then, so pass it on.
			throw error;
		}
	}

	// Create account
	const birthdate = dateUtils.dateToTimezone(birthday, dateUtils.utcTimezone);
	const age = dateUtils.getAge(birthdate);
	const consentNeeded = age < 16;

	let request:any = {
		username: username,
		birth_date_day: birthdate.getDate(),
		birth_date_month: birthdate.getMonth()+1,
		birth_date_year: birthdate.getFullYear(),
		consent_given: consentNeeded ? false : true,
	};

	if (!consentNeeded)
	{
		request.email = email;
	}

	const user = await accounts.signup(request);

	let callback = '/congrats';

	if (consentNeeded)
	{
		const [userData] = await db.query(`
			INSERT INTO consent_log (user_id, action_id, username, guid)
			VALUES ($1::int, 1, $2, gen_random_uuid())
			RETURNING guid
		`, user.id, username);

		await db.query(`
			UPDATE users
			SET consent_given = false
			WHERE id = $1::int
		`, user.id);

		callback = `/consent-needed/${userData.guid}`;
	}

	// deny access to GG Board if under age
	if (age < constants.ggBoardAge)
	{
		await db.query(`
			INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
			VALUES ($1, $2, $3, false)
		`, user.id, constants.boardIds.ggBoard, constants.nodePermissions.read);
	}

	if (ipAddresses)
	{
		// see api-requests
		ipAddresses = ipAddresses.split(',')
			.map((item:any) => item.trim());

		if (ipAddresses.length > 1)
		{
			// firewall IP changes but is always last
			ipAddresses.pop();
		}

		if (ipAddresses.length > 0)
		{
			await Promise.all([
				ipAddresses.map(async (ip:any) => {
					await db.query(`
						INSERT INTO user_ip_address (user_id, ip_address)
						VALUES ($1::int, $2)
						ON CONFLICT (user_id, ip_address) DO NOTHING
					`, user.id, ip);
				})
			]);
		}
	}

	return {
		_callback: callback,
	};
}

signup.apiTypes = {
	username: {
		type: APITypes.string,
		regex: constants.regexes.username,
		length: constants.max.username,
		min: constants.min.username,
		profanity: true,
		required: true,
	},
	email: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
		profanity: true,
		required: true,
	},
	birthday: {
		type: APITypes.date,
		required: true,
	},
	ipAddresses: {
		type: APITypes.string,
		default: '',
		nullable: true,
	},
}

type signupProps = {
	username: string
	email: string
	birthday: string
	ipAddresses: any
}

export default signup;