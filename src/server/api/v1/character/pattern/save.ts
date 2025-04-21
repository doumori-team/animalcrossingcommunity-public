import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { patternId, id }: saveProps): Promise<void>
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
	const [pattern] = await db.query(`
		SELECT name, creator_id, data_url
		FROM pattern
		WHERE id = $1::int
	`, patternId);

	if (!pattern)
	{
		throw new UserError('no-such-pattern');
	}

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
		SET door_pattern_id = $1, door_pattern_data_url = $3, door_pattern_creator_id = $4, door_pattern_name = $5
		WHERE id = $2::int
	`, pattern.creator_id === this.userId ? patternId : null, id, pattern.data_url, pattern.creator_id, pattern.name);
}

save.apiTypes = {
	patternId: {
		type: APITypes.number,
		required: true,
	},
	id: {
		type: APITypes.characterId,
		nullable: true,
	},
};

type saveProps = {
	patternId: number
	id: number
};

export default save;
