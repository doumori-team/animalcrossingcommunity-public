import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import * as db from '@db';
import { utils, constants, dateUtils } from '@utils';

async function consent_given({id, email})
{
	if (this.userId)
	{
		throw new UserError('permission');
	}

	const [user] = await db.query(`
		SELECT user_id
		FROM consent_log
		WHERE guid = $1
	`, id);

	if (!user)
	{
		throw new UserError('bad-format');
	}

	const birthdate = await accounts.getBirthDate(user.user_id);

	const age = dateUtils.getAge(birthdate);

	if (age >= 16 || age < 13)
	{
		throw new UserError('bad-format');
	}

	// Check if email is used

	try
	{
		await accounts.getUserData(null, null, email);

		throw new UserError('email-taken');
	}
	catch (error)
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

	await accounts.pushData(
	{
		user_id: user.user_id,
		email: email,
		consent_given: true,
	});

	const link = await accounts.resetPassword(user.user_id);

	await accounts.emailUser({
		email: email,
		subject: 'Welcome to Animal Crossing Community!',
		text: utils.getPasswordResetEmail(link, email),
	});

	await db.query(`
		INSERT INTO consent_log (user_id, action_id)
		VALUES ($1::int, 4)
	`, user.user_id);

	await db.query(`
		UPDATE users
		SET consent_given = true
		WHERE id = $1::int
	`, user.user_id);
}

consent_given.apiTypes = {
	id: {
		type: APITypes.uuid,
		required: true,
	},
	email: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
		profanity: true,
		required: true,
	},
}

export default consent_given;