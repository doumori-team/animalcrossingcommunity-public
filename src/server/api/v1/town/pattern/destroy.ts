import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

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
		SET flag_id = NULL, flag_creator_id = NULL, flag_data_url = NULL, flag_name = NULL
		WHERE id = $1::int
	`, id);
}

destroy.apiTypes = {
	id: {
		type: APITypes.townId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
