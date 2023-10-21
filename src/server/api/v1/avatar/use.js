import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function use({id})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [userAvatar] = await db.query(`
		SELECT
			user_avatar.user_id,
			user_avatar.character_id,
			user_avatar.accent_id,
			user_avatar.background_id,
			user_avatar.coloration_id,
			user_avatar.accent_position
		FROM user_avatar
		WHERE user_avatar.id = $1
	`, id);

	if (!userAvatar)
	{
		throw new UserError('bad-format');
	}

	if (userAvatar.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	// We can't have just a background or just foregrounds
	if ((userAvatar.background_id && !userAvatar.character_id) || (!userAvatar.background_id && userAvatar.character_id))
	{
		throw new UserError('incomplete-avatar');
	}

	const {backgrounds, colorations, accents, characters} = await this.query('v1/avatars');

	const background = backgrounds.find(bg => bg.id === userAvatar.background_id);

	if (!background ||
		!characters.some(character => character.id === userAvatar.character_id) ||
		(userAvatar.accent_id && !accents.some(accent => accent.id === userAvatar.accent_id)) ||
		(userAvatar.coloration_id && !colorations.some(coloration => coloration.id === userAvatar.coloration_id))
	)
	{
		throw new UserError('avatar-permission');
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
	`, userAvatar.character_id, userAvatar.accent_id, userAvatar.background_id, userAvatar.coloration_id, userAvatar.accent_position, this.userId);

	return {
		_success: 'You are now using this avatar.',
	};
}

use.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default use;