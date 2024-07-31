import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, HouseSizeType } from '@types';

async function house_size(this: APIThisType, {id}: houseSizeProps) : Promise<HouseSizeType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	let houseSizes = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			house_size_group.id,
			house_size_group.name
		FROM house_size
		JOIN ac_game_house_size ON (house_size.id = ac_game_house_size.house_size_id AND ac_game_house_size.game_id = $1::int)
		JOIN house_size_group ON (house_size.group_id = house_size_group.id)
		GROUP BY house_size_group.id
		ORDER BY house_size_group.id ASC
	`, id);

	if (houseSizes)
	{
		houseSizes = await Promise.all(houseSizes.map(async (houseSizeObj:any) =>
		{
			return {
				groupId: houseSizeObj.id,
				groupName: houseSizeObj.name,
				houseSizes: await db.cacheQuery(constants.cacheKeys.acGame, `
					SELECT
						house_size.id,
						house_size.name
					FROM house_size
					JOIN ac_game_house_size ON (house_size.id = ac_game_house_size.house_size_id AND ac_game_house_size.game_id = $1::int)
					WHERE house_size.group_id = $2::int
					ORDER BY house_size.id ASC
				`, id, houseSizeObj.id),
			};
		}));
	}

	return houseSizes;
}

house_size.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
}

type houseSizeProps = {
	id: number
}

export default house_size;