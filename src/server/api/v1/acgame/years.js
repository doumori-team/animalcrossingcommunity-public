import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';

async function years({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-calendar'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const acGameYears = id === 0 ? await ACCCache.get(constants.cacheKeys.years) : (await ACCCache.get(constants.cacheKeys.years))[id];

	if (id === 0)
	{
		return acGameYears;
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

	return acGameYears;
}

years.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
}

export default years;