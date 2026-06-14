import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, TownType } from '@types';

async function towns(this: APIThisType, { id }: townsProps): Promise<TownType[]>
{
	// Towns aren't paginated on purpose
	// Limiting here now just to prevent a server blowup in case someone just keeps making towns
	const towns: { id: number }[] = await db.query(`
		SELECT
			town.id
		FROM town
		WHERE user_id = $1::int
		ORDER BY town.id ASC
		LIMIT 30
	`, id);

	return await Promise.all(towns.map(async town =>
	{
		return this.query('v1/town', { id: town.id });
	}));
}

towns.permissions = [
	'use-trading-post',
	'view-towns',
];

towns.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
};

type townsProps = {
	id: number
};

export default towns;
