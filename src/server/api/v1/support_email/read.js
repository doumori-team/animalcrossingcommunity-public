import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

async function read({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [supportEmail] = await db.query(`
		SELECT id
		FROM support_email
		WHERE id = $1
	`, id);

	if (!supportEmail)
	{
		throw new UserError('no-such-support-email');
	}

	await db.query(`
		UPDATE support_email
		SET read = true
		WHERE id = $1
	`, id);

	await Promise.all([
		this.query('v1/notification/destroy', {
			id: id,
			type: constants.notification.types.supportEmail
		}),
	]);
}

read.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default read;