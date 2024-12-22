import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ACGameYearsType } from '@types';

async function years(this: APIThisType, { id }: yearsProps): Promise<ACGameYearsType | number[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-calendar' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const acGameYears: ACGameYearsType | number[] = id === 0 ? await ACCCache.get(constants.cacheKeys.years) : (await ACCCache.get(constants.cacheKeys.years))[id];

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
};

type yearsProps = {
	id: number
};

export default years;
