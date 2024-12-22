import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, PatternType } from '@types';

async function pattern(this: APIThisType, { id }: patternProps): Promise<PatternType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-patterns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [pattern] = await db.query(`
		SELECT
			pattern.id,
			pattern.name,
			pattern.creator_id,
			pattern.published,
			pattern.creation,
			pattern.design_id,
			encode(pattern.data, 'escape') AS data,
			pattern.data_url,
			pattern.game_id,
			pattern.palette_id,
			ac_game.shortname,
			pattern.qr_code_url
		FROM pattern
		JOIN ac_game ON (ac_game.id = pattern.game_id)
		WHERE pattern.id = $1::int
	`, id);

	if (!pattern)
	{
		throw new UserError('no-such-pattern');
	}

	const [[patternFav], creator] = await Promise.all([
		db.query(`
			SELECT id
			FROM pattern_favorite
			WHERE pattern_id = $1::int AND user_id = $2::int
		`, pattern.id, this.userId),
		this.query('v1/user_lite', { id: pattern.creator_id }),
	]);

	const colors = utils.getPatternColors(pattern.game_id);

	return <PatternType>{
		id: pattern.id,
		name: pattern.name,
		creator: creator,
		published: pattern.published,
		formattedDate: dateUtils.formatDateTimezone(pattern.creation),
		isFavorite: patternFav ? true : false,
		designId: pattern.design_id,
		data: pattern.data.match(/.{4}/g)
			.map((hex: any) => colors[parseInt(hex, 16)] ?
				colors[parseInt(hex, 16)] :
				String(parseInt(hex, 16)),
			),
		dataUrl: pattern.data_url,
		gameId: pattern.game_id,
		paletteId: pattern.palette_id,
		gameShortName: pattern.shortname,
		qrCodeUrl: pattern.qr_code_url,
	};
}

pattern.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type patternProps = {
	id: number
};

export default pattern;
