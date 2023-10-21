import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function towns({id})
{
	const [useTradingPostPerm, viewTowns] = await Promise.all([
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'view-towns'}),
	]);

	if (!(useTradingPostPerm || viewTowns))
	{
		throw new UserError('permission');
	}

	// Towns aren't paginated on purpose
	// Limiting here now just to prevent a server blowup in case someone just keeps making towns
	const towns = await db.query(`
		SELECT
			town.id
		FROM town
		WHERE user_id = $1::int
		ORDER BY town.id ASC
		LIMIT 100
	`, id);

	return await Promise.all(towns.map(async(town) => {
		return this.query('v1/town', {id: town.id})
	}));
}

towns.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
}

export default towns;