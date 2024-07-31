import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import * as accounts from '@accounts';
import { APIThisType,  } from '@types';

async function read(this: APIThisType, {toUser, subject, message}: readProps) : Promise<{id: number}>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [user] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE LOWER(username) = LOWER($1)
	`, toUser);

	if (!user)
	{
		throw new UserError('no-such-user');
	}

	const userData = await accounts.getUserData(user.id);

	await accounts.emailUser({
		email: userData.email,
		subject: subject,
		text: message.replace(constants.regexes.newLineToHTML, '<br/>'),
	});

	const [supportEmail] = await db.query(`
		INSERT INTO support_email (from_user_id, to_user_id, to_email, subject, recorded, body, read)
		VALUES ($1, $2, $3, $4, now(), $5, true)
		RETURNING id
	`, this.userId, user.id, userData.email, subject, message);

	return {
		id: supportEmail.id,
	}
}

read.apiTypes = {
	toUser: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
	subject: {
		type: APITypes.string,
		required: true,
		length: constants.max.subject,
		profanity: true,
	},
	message: {
		type: APITypes.string,
		required: true,
		length: constants.max.supportEmailBody,
		profanity: true,
	},
}

type readProps = {
	toUser: string
	subject: string
	message: string
}

export default read;