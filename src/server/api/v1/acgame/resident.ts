import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ResidentsType } from '@types';

async function resident(this: APIThisType, { id }: residentProps): Promise<ResidentsType | ResidentsType[number]>
{
	const [modifyTownsPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', { permission: 'modify-towns' }),
		this.query('v1/permission', { permission: 'use-trading-post' }),
	]);

	if (!(modifyTownsPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

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
