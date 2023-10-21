import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import * as accounts from '@accounts';

async function reply({id, message})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [supportEmail] = await db.query(`
		SELECT subject, from_user_id, from_email
		FROM support_email
		WHERE id = $1
	`, id);

	if (!supportEmail)
	{
		throw new UserError('no-such-support-email');
	}

	const subject = `RE: ${supportEmail.subject}`;

	let data = {
		subject: subject,
		text: message.replace(constants.regexes.newLineToHTML, '<br/>'),
	};

	if (supportEmail.from_email)
	{
		data.email = supportEmail.from_email;
	}
	else
	{
		data.user = supportEmail.from_user_id;
	}

	await accounts.emailUser(data);

	await Promise.all([
		db.query(`
			UPDATE support_email
			SET read = true
			WHERE id = $1
		`, id),
		this.query('v1/notification/destroy', {
			id: id,
			type: constants.notification.types.supportEmail
		}),
		db.query(`
			INSERT INTO support_email (from_user_id, to_user_id, to_email, subject, recorded, body, read)
			VALUES ($1, $2, $3, $4, now(), $5, true)
		`, this.userId, supportEmail.from_user_id, supportEmail.from_email, subject, message),
	]);
}

reply.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	message: {
		type: APITypes.string,
		required: true,
		length: constants.max.body,
		profanity: true,
	},
}

export default reply;