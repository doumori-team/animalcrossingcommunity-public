import * as db from '@db';
import { APIThisType, ACGameType } from '@types';

export default async function acgames(this: APIThisType) : Promise<ACGameType[]>
{
	// Used in lots of places; doesn't seem worth locking down

	const acgames = await db.query(`
		SELECT ac_game.id
		FROM ac_game
		ORDER BY has_town DESC, id ASC
	`);

	return await Promise.all(acgames.map(async(acgame:any) => {
		return this.query('v1/acgame', {id: acgame.id});
	}));
}