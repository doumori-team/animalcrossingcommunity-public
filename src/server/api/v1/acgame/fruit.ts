import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, FruitType } from '@types';

async function fruit(this: APIThisType, {id}: fruitProps) : Promise<FruitType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const fruit = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			fruit.id,
			fruit.name,
			ac_game_fruit.fruit_group AS group
		FROM fruit
		JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id)
		WHERE ac_game_fruit.game_id = $1::int
		ORDER BY fruit.name ASC
	`, id);

	return {
		all: fruit,
		regular: fruit.filter((f:any) => f.group === 'regular'),
		island1: fruit.filter((f:any) => f.group === 'island_1'),
		island2: fruit.filter((f:any) => f.group === 'island_2'),
		special: fruit.filter((f:any) => f.group === 'special'),
	}
}

fruit.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
}

type fruitProps = {
	id: number
}

export default fruit;