import * as db from '@db';
import { UserError } from '@errors';
import { utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { townId, acres }: saveProps): Promise<{ townId: number, userId: number }>
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
	const [town] = await db.query(`
		SELECT user_id, game_id
		FROM town
		WHERE town.id = $1::int
	`, townId);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	const mapTiles = utils.getMapTiles(town.game_id);

	acres = acres.map((id) =>
	{
		if (isNaN(id) || !mapTiles.all[Number(id)])
		{
			throw new UserError('bad-format');
		}

		return Number(id).toString(16).padStart(4, '0');
	});

	// Perform queries
	await db.query(`
		UPDATE town
		SET map_tiles = $2
		WHERE id = $1::int
	`, townId, acres.join(''));

	return {
		townId: townId,
		userId: town.user_id,
	};
}

save.apiTypes = {
	townId: {
		type: APITypes.townId,
		required: true,
	},
	acres: {
		type: APITypes.array,
		required: true,
	},
};

type saveProps = {
	townId: number
	acres: any[]
};

export default save;
