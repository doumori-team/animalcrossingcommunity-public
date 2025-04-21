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

	// Check parameters
	const [character] = await db.query(`
		SELECT town.user_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		WHERE character.id = $1::int
	`, id);

	if (character.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.query(`
		UPDATE character
		SET door_pattern_id = NULL, door_pattern_creator_id = NULL, door_pattern_data_url = NULL, door_pattern_name = NULL
		WHERE id = $1::int
	`, id);
}

destroy.apiTypes = {
	id: {
		type: APITypes.characterId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
