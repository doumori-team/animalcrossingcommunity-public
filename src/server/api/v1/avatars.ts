import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, AvatarsType, DataBackgroundType, DataAccentType, DataCharacterType, DataColorationType, BellShopItemsType, BellShopCategoryType, DataTagType } from '@types';

/*
 * Gets available avatars for user.
 */
export default async function avatars(this: APIThisType): Promise<AvatarsType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const groupIds = await db.getUserGroups(this.userId);

	const permissions = ['use-community-avatars', 'use-staff-avatars', 'use-modmin-avatars'];

	const [grantedPerms, [grantedAvatarPerms], bellShopRedeemedItems, availableIdsEvents] = await Promise.all([
		db.query(`
			SELECT *
			FROM (
				-- grab first of each permission using the order by
				SELECT DISTINCT ON (identifier) *
				FROM (
					SELECT *
					FROM (
						SELECT
							'user' AS type,
							user_permission.user_id AS type_id,
							user_permission.granted,
							permission.identifier
						FROM permission
						JOIN user_permission ON (user_permission.permission_id = permission.id)
						WHERE permission.identifier = ANY($1) AND user_permission.user_id = $2

						UNION ALL

						SELECT
							'group' AS type,
							user_group_permissions.type_id,
							user_group_permissions.granted,
							user_group_permissions.identifier
						FROM user_group_permissions
						WHERE user_group_permissions.identifier = ANY($1) AND user_group_permissions.user_group_id = ANY($3)
					) AS permissions
					ORDER BY type DESC, type_id DESC
				) AS permissions
			) AS permissions
			-- only then do we grab those that are granted
			WHERE granted = true
		`, permissions, this.userId, groupIds),
		db.query(`
			SELECT
				array_remove(array_agg(DISTINCT user_avatar_accent_permission.accent_id), NULL) AS accent_ids,
				array_remove(array_agg(DISTINCT user_avatar_character_permission.character_id), NULL) AS character_ids,
				array_remove(array_agg(DISTINCT user_avatar_background_permission.background_id), NULL) AS background_ids,
				array_remove(array_agg(DISTINCT user_avatar_coloration_permission.coloration_id), NULL) AS coloration_ids
			FROM users
			LEFT JOIN user_avatar_background_permission ON (user_avatar_background_permission.user_id = users.id)
			LEFT JOIN user_avatar_accent_permission ON (user_avatar_accent_permission.user_id = users.id)
			LEFT JOIN user_avatar_coloration_permission ON (user_avatar_coloration_permission.user_id = users.id)
			LEFT JOIN user_avatar_character_permission ON (user_avatar_character_permission.user_id = users.id)
			WHERE users.id = $1 AND (user_avatar_accent_permission.user_id IS NOT NULL OR user_avatar_background_permission.user_id IS NOT NULL OR user_avatar_accent_permission.user_id IS NOT NULL OR user_avatar_character_permission.user_id IS NOT NULL)
			GROUP BY users.id
		`, this.userId),
		db.query(`
			SELECT user_bell_shop_redeemed.item_id
			FROM user_bell_shop_redeemed
			WHERE user_bell_shop_redeemed.user_id = $1::int AND (expires IS NULL OR expires > now())
		`, this.userId),
		// see daily.js
		db.query(`
			SELECT *
			FROM avatars_events
			WHERE current_date BETWEEN start_date AND end_date
		`),
	]);

	const mappedPerms = grantedPerms.map((p: any) => p.identifier);
	const mappedBellShopRedeemedItems = bellShopRedeemedItems.map((i: any) => i.item_id);

	const avatarBackgrounds: DataBackgroundType[] = await ACCCache.get(constants.cacheKeys.alphabeticalAvatarBackgrounds);
	const sortedBellShopItems: BellShopItemsType = await ACCCache.get(constants.cacheKeys.sortedBellShopItems);
	const bellShopCategories: BellShopCategoryType[] = await ACCCache.get(constants.cacheKeys.bellShopCategories);

	const bellShopBackgroundCategory = bellShopCategories.find(c => c.name === constants.bellShop.categories.avatarBackgrounds);

	const availableBackgrounds = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.background_ids : [],
		mappedBellShopRedeemedItems.length > 0 && bellShopBackgroundCategory !== undefined ? sortedBellShopItems[bellShopBackgroundCategory.id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map((ae: any) => ae.background_ids).flat() : [],
		avatarBackgrounds,
		(bg: DataBackgroundType) =>
		{
			return {
				id: bg.id,
				name: bg.name,
				image: bg.image,
				colorable: bg.colorable,
				tags: bg.tags,
			};
		},
	);

	const avatarCharacters: DataCharacterType[] = await ACCCache.get(constants.cacheKeys.alphabeticalAvatarCharacters);

	const bellShopCharacterCategory = bellShopCategories.find(c => c.name === constants.bellShop.categories.avatarCharacters);

	const availableCharacters = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.character_ids : [],
		mappedBellShopRedeemedItems.length > 0 && bellShopCharacterCategory !== undefined ? sortedBellShopItems[bellShopCharacterCategory.id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map((ae: any) => ae.character_ids).flat() : [],
		avatarCharacters,
		(character: DataCharacterType) =>
		{
			return {
				id: character.id,
				name: character.name,
				image: character.image,
				tags: character.tags,
			};
		},
	);

	const avatarAccents: DataAccentType[] = await ACCCache.get(constants.cacheKeys.alphabeticalAvatarAccents);

	const bellShopAccentCategory = bellShopCategories.find(c => c.name === constants.bellShop.categories.avatarAccents);

	const availableAccents = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.accent_ids : [],
		mappedBellShopRedeemedItems.length > 0 && bellShopAccentCategory !== undefined ? sortedBellShopItems[bellShopAccentCategory.id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map((ae: any) => ae.accent_ids).flat() : [],
		avatarAccents,
		(accent: DataAccentType) =>
		{
			return {
				id: accent.id,
				name: accent.name,
				image: accent.image,
				positionable: accent.positionable,
				zIndex: accent.zIndex,
				tags: accent.tags,
			};
		},
	);

	const avatarColorations: DataColorationType[] = await ACCCache.get(constants.cacheKeys.alphabeticalAvatarColorations);

	const bellShopColorationCategory = bellShopCategories.find(c => c.name === constants.bellShop.categories.backgroundColorations);

	const availableColorations = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.coloration_ids : [],
		mappedBellShopRedeemedItems.length > 0 && bellShopColorationCategory !== undefined ? sortedBellShopItems[bellShopColorationCategory.id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map((ae: any) => ae.coloration_ids).flat() : [],
		avatarColorations,
		(coloration: DataColorationType) =>
		{
			return {
				id: coloration.id,
				name: coloration.name,
				css: coloration.css,
			};
		},
	);

	let characterTags: AvatarsType['tags']['characterTags'] = [], accentTags: AvatarsType['tags']['accentTags'] = [], backgroundTags: AvatarsType['tags']['backgroundTags'] = [];
	const usedTags = [...new Set([...availableBackgrounds.usedTags, ...availableCharacters.usedTags, ...availableAccents.usedTags])];

	const avatarTags = await ACCCache.get(constants.cacheKeys.avatarTags);

	avatarTags.forEach((tag: DataTagType) =>
	{
		if (usedTags.includes(tag.id))
		{
			if (tag.forCharacter)
			{
				characterTags.push({
					id: tag.id,
					name: tag.name,
				});
			}

			if (tag.forAccent)
			{
				accentTags.push({
					id: tag.id,
					name: tag.name,
				});
			}

			if (tag.forBackground)
			{
				backgroundTags.push({
					id: tag.id,
					name: tag.name,
				});
			}
		}
	});

	return <AvatarsType>{
		backgrounds: availableBackgrounds.available,
		accents: availableAccents.available,
		characters: availableCharacters.available,
		colorations: availableColorations.available,
		tags: { characterTags, accentTags, backgroundTags },
	};
}

/*
 * Get those avatars of each type that the user has access to.
 */
function getAvailableAvatars(grantedPerms: string[], grantedAvatarPerms: number[], bellShopRedeemedItems: number[], availableIdsEvents: number[], avatarTypes: DataBackgroundType[] | DataCharacterType[] | DataAccentType[] | DataColorationType[], transformFunc: Function)
{
	let available: DataBackgroundType[] | DataCharacterType[] | DataAccentType[] | DataColorationType[] = [], usedTags: string[] = [];

	for (const key in avatarTypes)
	{
		const at = avatarTypes[key];
		let checkDateRestricted = false, isAvailable = false;

		if (Object.prototype.hasOwnProperty.call(at, 'permissions') && at.permissions)
		{
			if (at.permissions.some(p => grantedPerms.includes(p)))
			{
				if (at.dateRestricted)
				{
					checkDateRestricted = true;
				}
				else
				{
					isAvailable = true;
				}
			}
		}

		if (grantedAvatarPerms.includes(at.id))
		{
			if (at.dateRestricted)
			{
				checkDateRestricted = true;
			}
			else
			{
				isAvailable = true;
			}
		}

		if (bellShopRedeemedItems.includes(at.id))
		{
			if (at.dateRestricted)
			{
				checkDateRestricted = true;
			}
			else
			{
				isAvailable = true;
			}
		}

		if (checkDateRestricted)
		{
			if (availableIdsEvents.includes(at.id))
			{
				isAvailable = true;
			}
		}

		if (isAvailable)
		{
			available.push(transformFunc(at));

			if (Object.prototype.hasOwnProperty.call(at, 'tags'))
			{
				usedTags = [...new Set([...usedTags, ...(at as DataBackgroundType | DataCharacterType | DataAccentType).tags])];
			}
		}
	}

	return { available, usedTags };
}
