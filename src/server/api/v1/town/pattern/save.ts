import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, {patternId, id}: saveProps) : Promise<{userId: number}>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-towns'});

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
		SELECT id, name, creator_id, data_url
		FROM pattern
		WHERE id = $1::int
	`, patternId);

	if (!pattern)
	{
		throw new UserError('no-such-pattern');
	}

	const [town] = await db.query(`
		SELECT user_id
		FROM town
		WHERE id = $1::int
	`, id);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE town
		SET flag_id = $1, flag_data_url = $3, flag_creator_id = $4, flag_name = $5
		WHERE id = $2::int
	`, pattern.creator_id === this.userId ? patternId : null, id, pattern.data_url, pattern.creator_id, pattern.name);

	return {
		userId: this.userId,
	};
}

save.apiTypes = {
	patternId: {
		type: APITypes.number,
		required: true,
	},
	id: {
		type: APITypes.townId,
		nullable: true,
	},
}

type saveProps = {
	patternId: number
	id: number|null
}

export default save;