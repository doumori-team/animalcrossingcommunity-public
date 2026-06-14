import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

/*
 * Toggle favorite for a pattern
 */
async function favorite(this: APIThisType, { patternId }: favoriteProps): Promise<void>
{
	const [patternFavId] = await db.query(`
		SELECT id
		FROM pattern_favorite
		WHERE pattern_id = $1::int AND user_id = $2::int
	`, patternId, this.userId);

	if (patternFavId)
	{
		await db.query(`
			DELETE FROM pattern_favorite
			WHERE id = $1::int
		`, patternFavId.id);
	}
	else
	{
		await db.query(`
			INSERT INTO pattern_favorite (user_id, pattern_id)
			VALUES ($1::int, $2::int)
		`, this.userId, patternId);
	}
}

favorite.permissions = [
	'view-patterns',
	'userId',
];

favorite.apiTypes = {
	patternId: {
		type: APITypes.patternId,
		required: true,
	},
};

type favoriteProps = {
	patternId: number
};

export default favorite;
