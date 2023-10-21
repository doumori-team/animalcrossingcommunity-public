import * as db from '@db';
import { UserError } from '@errors';
import { years as acGameYears } from '@/catalog/events.js';
import * as APITypes from '@apiTypes';

async function years({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-calendar'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

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

	return acGameYears[id];
}

years.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
}

export default years;