import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { ACCCache } from '@cache';

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

	const avatarBackground = (await ACCCache.get(constants.cacheKeys.indexedAvatarBackgrounds))[userAvatar.avatar_background_id];
	const avatarCharacter = (await ACCCache.get(constants.cacheKeys.indexedAvatarCharacters))[userAvatar.avatar_character_id];
	const avatarColoration = userAvatar.avatar_coloration_id ? (await ACCCache.get(constants.cacheKeys.indexedAvatarColorations))[userAvatar.avatar_coloration_id] : null;
	const avatarAccent = userAvatar.avatar_accent_id ? (await ACCCache.get(constants.cacheKeys.indexedAvatarAccents))[userAvatar.avatar_accent_id] : null;

	if (!avatarBackground ||
		!avatarCharacter ||
		(userAvatar.avatar_coloration_id && !avatarColoration) ||
		(userAvatar.avatar_accent_id && !avatarAccent)
	)
	{
		throw new UserError('no-such-avatar');
	}

	return {
		background: {
			id: avatarBackground.id,
			name: avatarBackground.name,
			image: avatarBackground.image,
			colorable: avatarBackground.colorable,
			tags: avatarBackground.tags
		},
		coloration: userAvatar.avatar_coloration_id ? {
			id: avatarColoration.id,
			name: avatarColoration.name,
			css: avatarColoration.css
		} : null,
		character: {
			id: avatarCharacter.id,
			name: avatarCharacter.name,
			image: avatarCharacter.image,
			tags: avatarCharacter.tags
		},
		accent: userAvatar.avatar_accent_id ? {
			id: avatarAccent.id,
			name: avatarAccent.name,
			image: avatarAccent.image,
			positionable: avatarAccent.positionable,
			zIndex: avatarAccent.zIndex,
			tags: avatarAccent.tags
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