import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [town] = await db.query(`
		SELECT id, user_id
		FROM town
		WHERE town.id = $1::int
	`, id);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.query(`
		UPDATE town
		SET town_tune_id = NULL, town_tune_creator_id = NULL, town_tune_notes = NULL, town_tune_name = NULL
		WHERE id = $1::int
	`, id);
}

destroy.apiTypes = {
	id: {
		type: APITypes.townId,
	},
}

export default destroy;