import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'polls-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Confirm not expired
	const [poll] = await db.query(`
		SELECT now() > poll.start_date + poll.duration AS expired
		FROM poll
		WHERE id = $1::int
	`, id);

	if (poll.expired)
	{
		throw new UserError('poll-expired');
	}

	await db.query(`
		DELETE FROM poll
		WHERE id = $1::int
	`, id);
}

destroy.apiTypes = {
	id: {
		type: APITypes.pollId,
	},
}

export default destroy;