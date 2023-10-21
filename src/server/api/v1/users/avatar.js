import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { indexedAvatarAccents as avatarAccents } from '@/data/avatar/avatars.js';
import { indexedAvatarBackgrounds as avatarBackgrounds } from '@/data/avatar/avatars.js';
import { indexedAvatarCharacters as avatarCharacters } from '@/data/avatar/avatars.js';
import { indexedAvatarColorations as avatarColorations } from '@/data/avatar/avatars.js';
import { UserError } from '@errors';

/*
 * Fetches information about a user's avatar.
 *
 * If the user exists, returns an object with following keys:
 *   background - object with properties:
 *		id - number - self-explanatory
 *		name - string - human readable name of bg for display
 *		image - string - file name (no extension)
 *		colorable - boolean - whether background should be colored
 * 		tags - array of objects with properties:
 * 			id - number - tag id
 * 			parentID - number - id of parent tag (if applicable)
 *	coloration - object with properties:
 *		id - number - self-explanatory
 *		name - string - human readable name of coloration for display
 *		css - string - value of coloration in CSS definitions
 *	character - object with properties:
 *		id - number - self-explanatory
 *		name - string - human readable name of character for display
 *		image - string - file name (no extension)
 * 		tags - array of objects with properties:
 * 			id - number - tag id
 * 			parentID - number - id of parent tag (if applicable)
 *	accent - object with properties:
 *		id - number - self-explanatory
 *		name - string - human readable name of accent for display
 *		image - string - file name (no extension)
 *		positionable - boolean - whether or not accent can be positioned
 *		zIndex - number - depth of accent for layering
 * 		tags - array of objects with properties:
 * 			id - number - tag id
 * 			parentID - number - id of parent tag (if applicable)
 */
async function avatar({id})
{
	const [viewForums, viewProfiles] = await Promise.all([
		this.query('v1/node/permission', {permission: 'read', nodeId: constants.boardIds.accForums}),
		this.query('v1/permission', {permission: 'view-profiles'}),
	]);

	if (!(viewForums || viewProfiles))
	{
		throw new UserError('permission');
	}

	const [userAvatar] = await db.query(`
		SELECT
			users.avatar_background_id,
			users.avatar_coloration_id,
			users.avatar_character_id,
			users.avatar_accent_id,
			users.avatar_accent_position
		FROM users
		WHERE users.id = $1::int
	`, id);

	if (!userAvatar.avatar_background_id)
	{
		// No avatar, so use defaults
		return {...constants.defaultAvatar};
	}

	if (!userAvatar.avatar_background_id || !userAvatar.avatar_character_id)
	{
		throw new UserError('incomplete-avatar');
	}

	if (!avatarBackgrounds[userAvatar.avatar_background_id] ||
		!avatarCharacters[userAvatar.avatar_character_id] ||
		(userAvatar.avatar_coloration_id && !avatarColorations[userAvatar.avatar_coloration_id]) ||
		(userAvatar.avatar_accent_id && !avatarAccents[userAvatar.avatar_accent_id])
	)
	{
		throw new UserError('no-such-avatar');
	}

	return {
		background: {
			id: avatarBackgrounds[userAvatar.avatar_background_id].id,
			name: avatarBackgrounds[userAvatar.avatar_background_id].name,
			image: avatarBackgrounds[userAvatar.avatar_background_id].image,
			colorable: avatarBackgrounds[userAvatar.avatar_background_id].colorable,
			tags: avatarBackgrounds[userAvatar.avatar_background_id].tags
		},
		coloration: userAvatar.avatar_coloration_id ? {
			id: avatarColorations[userAvatar.avatar_coloration_id].id,
			name: avatarColorations[userAvatar.avatar_coloration_id].name,
			css: avatarColorations[userAvatar.avatar_coloration_id].css
		} : null,
		character: {
			id: avatarCharacters[userAvatar.avatar_character_id].id,
			name: avatarCharacters[userAvatar.avatar_character_id].name,
			image: avatarCharacters[userAvatar.avatar_character_id].image,
			tags: avatarCharacters[userAvatar.avatar_character_id].tags
		},
		accent: userAvatar.avatar_accent_id ? {
			id: avatarAccents[userAvatar.avatar_accent_id].id,
			name: avatarAccents[userAvatar.avatar_accent_id].name,
			image: avatarAccents[userAvatar.avatar_accent_id].image,
			positionable: avatarAccents[userAvatar.avatar_accent_id].positionable,
			zIndex: avatarAccents[userAvatar.avatar_accent_id].zIndex,
			tags: avatarAccents[userAvatar.avatar_accent_id].tags
		} : null,
		accentPosition: Number(userAvatar.avatar_accent_position)
	};
}

avatar.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
}

export default avatar;