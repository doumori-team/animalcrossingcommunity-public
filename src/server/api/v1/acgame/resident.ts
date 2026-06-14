import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ResidentsType } from '@types';

async function resident(this: APIThisType, { id }: residentProps): Promise<ResidentsType | ResidentsType[number]>
{
	const sortedResidents: ResidentsType[number] | ResidentsType = id === 0 ? await ACCCache.get(constants.cacheKeys.residents) : (await ACCCache.get(constants.cacheKeys.residents))[id];

	if (id === 0)
	{
		return sortedResidents;
	}

	const [game] = await db.query(`
		SELECT id
		FROM ac_game
		WHERE id = $1::int AND has_town = true
	`, id);

	if (!game)
	{
		throw new UserError('no-such-ac-game');
	}

	return sortedResidents;
}

resident.permissions = [
	'modify-towns',
	'use-trading-post',
];

resident.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
};

type residentProps = {
	id: number
};

export default resident;
