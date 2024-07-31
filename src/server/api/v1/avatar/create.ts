import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, AvatarsType } from '@types';

async function create(this: APIThisType, {backgroundId, colorationId, characterId, accentId, accentPosition}: createProps) : Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// We can't have just a background or just foregrounds
	if ((backgroundId && !characterId) || (!backgroundId && characterId))
	{
		throw new UserError('incomplete-avatar');
	}

	const {backgrounds, colorations, accents, characters}: AvatarsType = await this.query('v1/avatars');

	const background = backgrounds.find(bg => bg.id === backgroundId);

	if (!background ||
		!characters.some(character => character.id === characterId) ||
		(accentId && !accents.some(accent => accent.id === accentId)) ||
		(colorationId && !colorations.some(coloration => coloration.id === colorationId))
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
	if ((!accentId || !(accents.find(accent => accent.id === accentId)?.positionable)) && accentPosition)
	{
		accentPosition = null;
	}

	await db.query(`
		INSERT INTO user_avatar (user_id, character_id, accent_id, background_id, coloration_id, accent_position)
		VALUES ($1::int, $2::int, $3::int, $4::int, $5::int, $6::int)
	`, this.userId, characterId, accentId, backgroundId, colorationId, accentPosition);
}

create.apiTypes = {
	backgroundId: {
		type: APITypes.number,
		required: true,
	},
	colorationId: {
		type: APITypes.number,
		nullable: true,
	},
	characterId: {
		type: APITypes.number,
		required: true,
	},
	accentId: {
		type: APITypes.number,
		nullable: true,
	},
	accentPosition: {
		type: APITypes.number,
		nullable: true,
		min: 1,
		max: 4,
	},
}

type createProps = {
	backgroundId: number
	colorationId: number|null
	characterId: number
	accentId: number|null
	accentPosition: number|null
}

export default create;