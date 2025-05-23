import * as db from '@db';
import { UserError } from '@errors';
import * as accounts from '@accounts';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, { email, showBirthday, showAge, awayStartDate, awayEndDate,
	showEmail, emailNotifications, showStaff, shopDNC, southernHemisphere,
	stayForever, consolidateCalendars }: saveProps): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (awayStartDate != null && awayEndDate != null && dateUtils.isAfter(dateUtils.dateToTimezone(awayStartDate), dateUtils.dateToTimezone(awayEndDate)))
	{
		throw new UserError('bad-format');
	}

	const account = await accounts.getUserData(this.userId);

	try
	{
		await accounts.pushData(
			{
				user_id: account.id,
				email: email,
			});
	}
	catch (error: any)
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

	await Promise.all([
		db.query(`
			UPDATE users
			SET
				show_birthday = $2,
				show_age = $3,
				away_start_date = $4,
				away_end_date = $5,
				show_email = $6,
				email_notifications = $7,
				show_staff = $8,
				southern_hemisphere = $9,
				stay_forever = $10,
				consolidate_calendars = $11
			WHERE id = $1::int
		`, account.id, showBirthday, showAge, awayStartDate, awayEndDate, showEmail, emailNotifications, showStaff, southernHemisphere, stayForever, consolidateCalendars),
		db.query(`
			DELETE FROM shop_dnc
			WHERE user_id = $1
		`, account.id),
	]);

	if (shopDNC)
	{
		await db.query(`
			INSERT INTO shop_dnc (user_id)
			VALUES ($1)
		`, account.id);
	}

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
		catch (error: any)
		{
			console.error('accounts.emailUser error:', error);
		}

		return {
			_logout: 'Your email has been updated. You will now be logged out.',
		};
	}

	return {
		_success: 'Your account settings have been updated.',
	};
}

function getEmailText(username: string, newEmail: string, oldEmail: string): string
{
	const vbnewline = '<br/>';

	const origSendTo = constants.LIVE_SITE ? '' : `Originally sending to: ${oldEmail}${vbnewline}${vbnewline}`;

	let email = `Hello ${username},${vbnewline}${vbnewline}`;
	email += `This is to notify you that someone has updated your email to ${newEmail}. If you did this, you may safely disregard this email. If you did not, reply to this email and someone will reply to you within 48 hours.${vbnewline}${vbnewline}`;

	email += `${vbnewline}${vbnewline}ACC Staff`;

	return '<span style="font-family: Verdana; font-size: 11px;">' + origSendTo + email + '</span>';
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
	showStaff: {
		type: APITypes.boolean,
		default: 'false',
	},
	shopDNC: {
		type: APITypes.boolean,
		default: 'false',
	},
	southernHemisphere: {
		type: APITypes.boolean,
		default: 'false',
	},
	stayForever: {
		type: APITypes.boolean,
		default: 'false',
	},
	consolidateCalendars: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type saveProps = {
	email: string
	showBirthday: boolean
	showAge: boolean
	awayStartDate: string | null
	awayEndDate: string | null
	showEmail: boolean
	emailNotifications: boolean
	showStaff: boolean
	shopDNC: boolean
	southernHemisphere: boolean
	stayForever: boolean
	consolidateCalendars: boolean
};

export default save;
