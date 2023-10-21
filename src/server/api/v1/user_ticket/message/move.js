import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Move a message to staff notes.
 */
async function move({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [message] = await db.query(`
		SELECT staff_only
		FROM user_ticket_message
		WHERE id = $1::int
	`, id);

	if (!message)
	{
		throw new UserError('bad-format');
	}

	if (message.staff_only)
	{
		return;
	}

	await db.query(`
		UPDATE user_ticket_message
		SET staff_only = true
		WHERE id = $1::int
	`, id);
}

move.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
}

export default move;