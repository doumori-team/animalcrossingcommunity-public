import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { tuneId, id }: saveProps): Promise<{ userId: number }>
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
	const [tune] = await db.query(`
		SELECT id, notes, creator_id, name
		FROM town_tune
		WHERE town_tune.id = $1::int
	`, tuneId);

	if (!tune)
	{
		throw new UserError('no-such-tune');
	}

	const [town] = await db.query(`
		SELECT user_id
		FROM town
		WHERE town.id = $1::int
	`, id);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE town
		SET town_tune_id = $1, town_tune_notes = $3, town_tune_creator_id = $4, town_tune_name = $5
		WHERE id = $2::int
	`, tune.creator_id === this.userId ? tuneId : null, id, tune.notes, tune.creator_id, tune.name);

	return {
		userId: this.userId,
	};
}

save.apiTypes = {
	tuneId: {
		type: APITypes.number,
		required: true,
	},
	id: {
		type: APITypes.townId,
		nullable: true,
	},
};

type saveProps = {
	tuneId: number
	id: number | null
};

export default save;
