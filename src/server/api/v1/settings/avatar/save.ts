import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, AvatarsType } from '@types';

async function save(this: APIThisType, { backgroundId, colorationId, characterId, accentId, accentPosition, useDefault }: saveProps): Promise<SuccessType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (useDefault)
	{
		characterId = null;
		backgroundId = null;
		colorationId = null;
		accentId = null;
		accentPosition = null;
	}
	else
	{
		// We can't have just a background or just foregrounds
		if (backgroundId && !characterId || !backgroundId && characterId)
		{
			throw new UserError('incomplete-avatar');
		}

		const { backgrounds, colorations, accents, characters }: AvatarsType = await this.query('v1/avatars');

		const background = backgrounds.find(bg => bg.id === backgroundId);

		if (!background ||
			!characters.some(character => character.id === characterId) ||
			accentId && !accents.some(accent => accent.id === accentId) ||
			colorationId && !colorations.some(coloration => coloration.id === colorationId)
		)
		{
			throw new UserError('avatar-permission');
		}

		// Nuke coloration if background not colorable
		if (!background.colorable && colorationId)
		{
			colorationId = null;
		}

		// Nuke accent positioning if it's not positionable
		if ((!accentId || !accents.find(accent => accent.id === accentId)?.positionable) && accentPosition)
		{
			accentPosition = null;
		}
	}

	await db.query(`
		UPDATE users
		SET
			avatar_character_id = $1::int,
			avatar_accent_id = $2::int,
			avatar_background_id = $3::int,
			avatar_coloration_id = $4::int,
			avatar_accent_position = $5::int
		WHERE id = $6::int
	`, characterId, accentId, backgroundId, colorationId, accentPosition, this.userId);

	return {
		_success: 'Your avatar has been updated.',
		_callbackFirst: true,
	};
}

save.apiTypes = {
	backgroundId: {
		type: APITypes.number,
	},
	colorationId: {
		type: APITypes.number,
		nullable: true,
	},
	characterId: {
		type: APITypes.number,
	},
	accentId: {
		type: APITypes.number,
		nullable: true,
	},
	accentPosition: {
		type: APITypes.number,
		min: 1,
		max: 4,
	},
	useDefault: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type saveProps = {
	backgroundId: number | null
	colorationId: number | null
	characterId: number | null
	accentId: number | null
	accentPosition: number | null
	useDefault: boolean
};

export default save;
