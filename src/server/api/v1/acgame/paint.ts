import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, PaintType } from '@types';

async function paint(this: APIThisType, { id }: paintProps): Promise<PaintType[]>
{
	const paintColors = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			ac_game_paint.id,
			paint.name,
			paint.hex
		FROM paint
		JOIN ac_game_paint ON (paint.id = ac_game_paint.paint_id)
		WHERE ac_game_paint.game_id = $1::int
		ORDER BY ac_game_paint.id ASC
	`, id);

	return paintColors;
}

paint.permissions = [
	'modify-towns',
];

paint.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type paintProps = {
	id: number
};

export default paint;
