import * as db from '@db';

export default async function acgames()
{
	// Used in lots of places; doesn't seem worth locking down

	const acgames = await db.query(`
		SELECT
			ac_game.id
		FROM ac_game
		ORDER BY has_town DESC, id ASC
	`);

	return await Promise.all(acgames.map(async(acgame) => {
		return this.query('v1/acgame', {id: acgame.id});
	}));
}