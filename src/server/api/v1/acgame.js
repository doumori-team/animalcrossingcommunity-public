import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function acgame({id})
{
	// Used in lots of places; doesn't seem worth locking down

	const [acgame] = await db.query(`
		SELECT
			ac_game.id,
			ac_game.name,
			ac_game.shortname,
			ac_game.has_town,
			ac_game.max_residents
		FROM ac_game
		WHERE ac_game.id = $1::int
	`, id);

	if (!acgame)
	{
		throw new UserError('no-such-ac-game');
	}

	return {
		id: acgame.id,
		name: acgame.name,
		shortname: acgame.shortname,
		hasTown: acgame.has_town,
		maxResidents: acgame.max_residents,
		identifier: acgame.shortname.replace(':', '').toLowerCase(),
	};
}

acgame.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default acgame;