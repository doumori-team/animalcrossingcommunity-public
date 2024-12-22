import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, PaintType } from '@types';

async function paint(this: APIThisType, { id }: paintProps): Promise<PaintType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

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
