import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import * as db from '@db';
import { utils, constants, dateUtils } from '@utils';
import { APIThisType, SuccessType } from '@types';

async function email_needed(this: APIThisType, { id, email }: emailNeededProps): Promise<SuccessType>
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

	if (age >= 16)
	{
		throw new UserError('bad-format');
	}

	// Check if email is used

	try
	{
		await accounts.getUserData(null, null, email);

		throw new UserError('email-taken');
	}
	catch (error: any)
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
		});

	const link = await accounts.resetPassword(user.user_id);

	await accounts.emailUser({
		email: email,
		subject: 'Welcome to Animal Crossing Community!',
		text: utils.getPasswordResetEmail(link, email),
	});

	return {
		_success: 'We have sent a reset password link to your email.',
	};
}

email_needed.apiTypes = {
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
};

type emailNeededProps = {
	id: string
	email: string
};

export default email_needed;
