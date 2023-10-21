import * as db from '@db';
import { UserError } from '@errors';
import { residents as sortedResidents } from '@/catalog/residents.js';
import * as APITypes from '@apiTypes';

async function resident({id})
{
	const [modifyTownsPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-towns'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(modifyTownsPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

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

	return sortedResidents[id];
}

resident.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
}

export default resident;