import * as db from '@db';
import { UserError } from '@errors';
import * as accounts from '@accounts';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function save({email, showBirthday, showAge, awayStartDate, awayEndDate, showEmail, emailNotifications})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (dateUtils.isAfter(dateUtils.dateToTimezone(awayStartDate), dateUtils.dateToTimezone(awayEndDate)))
	{
		throw new UserError('bad-format');
	}

	const account = await accounts.getUserData(this.userId);

	try
	{
		await accounts.pushData(
		{
			user_id: account.id,
			email: email
		});
	}
	catch (error)
	{
		// Some other user is using the email address
		if (error.name === 'AccountsError' && error.statusCode === 409)
		{
			throw new UserError('duplicate-email');
		}
		else
		{
			// Not this function's problem then, so pass it on.
			throw error;
		}
	}

	await db.query(`
		UPDATE users
		SET
			show_birthday = $2,
			show_age = $3,
			away_start_date = $4,
			away_end_date = $5,
			show_email = $6,
			email_notifications = $7
		WHERE id = $1::int
	`, account.id, showBirthday, showAge, awayStartDate, awayEndDate, showEmail, emailNotifications);

	if (email !== account.email)
	{
		try
		{
			await accounts.emailUser({
				email: account.email,
				subject: 'Change of Email',
				text: getEmailText(account.username, email, account.email),
			});
		}
		catch (error)
		{
			console.error(error);
		}

		return {
			_logout: 'Your email has been updated. You will now be logged out.'
		};
	}

	return {
		_success: 'Your account settings have been updated.',
		_callbackFirst: true,
	};
}

function getEmailText(username, newEmail, oldEmail)
{
	const vbnewline = '<br/>';

	const origSendTo = constants.LIVE_SITE ? '' : `Originally sending to: ${oldEmail}${vbnewline}${vbnewline}`;

	let email = `Hello ${username},${vbnewline}${vbnewline}`;
	email += `This is to notify you that someone has updated your email to ${newEmail}. If you did this, you may safely disregard this email. If you did not, reply to this email and someone will reply to you within 48 hours.${vbnewline}${vbnewline}`;

	email += `${vbnewline}${vbnewline}ACC Staff`;

	return '<span style="font-family: Verdana; font-size: 11px;">'+origSendTo+email+'</span>';
}

save.apiTypes = {
	email: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
		profanity: true,
	},
	showBirthday: {
		type: APITypes.boolean,
		default: 'false',
	},
	showAge: {
		type: APITypes.boolean,
		default: 'false',
	},
	awayStartDate: {
		type: APITypes.date,
		nullable: true,
	},
	awayEndDate: {
		type: APITypes.date,
		nullable: true,
	},
	showEmail: {
		type: APITypes.boolean,
		default: 'false',
	},
	emailNotifications: {
		type: APITypes.boolean,
		default: 'false',
	},
}

export default save;