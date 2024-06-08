import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';

async function avatars({page})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let results = [], count = 0;

	const avatars = await db.query(`
		SELECT
			user_avatar.id,
			user_avatar.character_id,
			user_avatar.accent_id,
			user_avatar.background_id,
			user_avatar.coloration_id,
			user_avatar.accent_position,
			count(*) over() AS count
		FROM user_avatar
		WHERE user_avatar.user_id = $3
		ORDER BY user_avatar.created DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, this.userId);

	if (avatars.length > 0)
	{
		const avatarBackgrounds = await ACCCache.get(constants.cacheKeys.indexedAvatarBackgrounds);
		const avatarCharacters = await ACCCache.get(constants.cacheKeys.indexedAvatarCharacters);
		const avatarColorations = await ACCCache.get(constants.cacheKeys.indexedAvatarColorations);
		const avatarAccents = await ACCCache.get(constants.cacheKeys.indexedAvatarAccents);

		results = avatars.map(avatar => {
			return {
				id: avatar.id,
				background: avatar.background_id ? avatarBackgrounds[avatar.background_id] : null,
				character: avatar.character_id ? avatarCharacters[avatar.character_id] : null,
				accent: avatar.accent_id ? avatarAccents[avatar.accent_id] : null,
				accentPosition: avatar.accent_position ? avatar.accent_position : null,
				coloration: avatar.coloration_id ? avatarColorations[avatar.coloration_id] : null,
			}
		})

		count = Number(avatars[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
	};
}

avatars.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
}

export default avatars;