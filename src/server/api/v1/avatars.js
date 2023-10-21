import * as db from '@db';
import { alphabeticalAvatarBackgrounds as avatarBackgrounds } from '@/data/avatar/avatars.js';
import { alphabeticalAvatarCharacters as avatarCharacters } from '@/data/avatar/avatars.js';
import { alphabeticalAvatarColorations as avatarColorations } from '@/data/avatar/avatars.js';
import { alphabeticalAvatarAccents as avatarAccents } from '@/data/avatar/avatars.js';
import { UserError } from '@errors';
import { avatarTags } from '@/data/avatar/avatars.js';
import { sortedBellShopItems, getBellShopCategories } from '@/catalog/info.js';
import { constants } from '@utils';

/*
 * Gets available avatars for user.
 */
export default async function avatars()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const groupIds = await this.query('v1/users/user_groups');

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
				array_agg(user_avatar_accent_permission.accent_id) AS accent_ids,
				array_agg(user_avatar_character_permission.character_id) AS character_ids,
				array_agg(user_avatar_background_permission.background_id) AS background_ids,
				array_agg(user_avatar_coloration_permission.coloration_id) AS coloration_ids
			FROM users
			LEFT JOIN user_avatar_background_permission ON (user_avatar_background_permission.user_id = users.id)
			LEFT JOIN user_avatar_accent_permission ON (user_avatar_accent_permission.user_id = users.id)
			LEFT JOIN user_avatar_coloration_permission ON (user_avatar_coloration_permission.user_id = users.id)
			LEFT JOIN user_avatar_character_permission ON (user_avatar_character_permission.user_id = users.id)
			WHERE users.id = $1 AND user_avatar_accent_permission.user_id IS NOT NULL OR user_avatar_background_permission.user_id IS NOT NULL OR user_avatar_accent_permission.user_id IS NOT NULL OR user_avatar_character_permission.user_id IS NOT NULL
			GROUP BY users.id
		`, this.userId),
		db.query(`
			SELECT user_bell_shop_redeemed.item_id
			FROM user_bell_shop_redeemed
			WHERE user_bell_shop_redeemed.user_id = $1::int AND (expires IS NULL OR expires > now())
		`, this.userId),
		db.query(`
			SELECT *
			FROM (
				-- For each event date, get all the accents, characters, backgrounds and colorations
				SELECT
					array_agg(avatar_accent_eventmap.accent_id) AS accent_ids,
					array_agg(avatar_character_eventmap.character_id) AS character_ids,
					array_agg(avatar_background_eventmap.background_id) AS background_ids,
					array_agg(avatar_coloration_eventmap.coloration_id) AS coloration_ids,
					TO_DATE(coalesce(avatar_event_dates.start_year, date_part('year', now())) || TO_CHAR(avatar_event_dates.start_month, 'FM00') || (case when avatar_event_dates.start_month = 2 AND avatar_event_dates.start_day = 29 then (case when extract(year from now())::integer % 4 = 0 then avatar_event_dates.start_day else 28 end) else avatar_event_dates.start_day end), 'YYYYMMDD') AS start_date,
					TO_DATE(coalesce(avatar_event_dates.end_year, date_part('year', now())) || TO_CHAR(avatar_event_dates.end_month, 'FM00') || (case when avatar_event_dates.end_month = 2 AND avatar_event_dates.end_day = 29 then (case when extract(year from now())::integer % 4 = 0 then avatar_event_dates.end_day else 28 end) else avatar_event_dates.end_day end), 'YYYYMMDD') AS end_date
				FROM avatar_event_dates
				JOIN avatar_event ON (avatar_event.id = avatar_event_dates.event_id)
				LEFT JOIN avatar_accent_eventmap ON (avatar_accent_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_character_eventmap ON (avatar_character_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_background_eventmap ON (avatar_background_eventmap.event_id = avatar_event.id)
				LEFT JOIN avatar_coloration_eventmap ON (avatar_coloration_eventmap.event_id = avatar_event.id)
				WHERE avatar_accent_eventmap.event_id IS NOT NULL OR avatar_character_eventmap.event_id IS NOT NULL OR avatar_background_eventmap.event_id IS NOT NULL OR avatar_coloration_eventmap.event_id IS NOT NULL
				GROUP BY avatar_event_dates.id
			) AS avatar_events
			WHERE current_date BETWEEN start_date AND end_date
		`),
	]);

	const mappedPerms = grantedPerms.map(p => p.identifier);
	const mappedBellShopRedeemedItems = bellShopRedeemedItems.map(i => i.item_id);

	const availableBackgrounds = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.background_ids : [],
		mappedBellShopRedeemedItems.length > 0 ? sortedBellShopItems[getBellShopCategories().find(c => c.name === constants.bellShop.categories.avatarBackgrounds).id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map(ae => ae.background_ids).flat() : [],
		avatarBackgrounds,
		(bg) => {
			return {
				id: bg.id,
				name: bg.name,
				image: bg.image,
				colorable: bg.colorable,
				tags: bg.tags
			};
		},
	);

	const availableCharacters = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.character_ids : [],
		mappedBellShopRedeemedItems.length > 0 ? sortedBellShopItems[getBellShopCategories().find(c => c.name === constants.bellShop.categories.avatarCharacters).id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map(ae => ae.character_ids).flat() : [],
		avatarCharacters,
		(character) => {
			return {
				id: character.id,
				name: character.name,
				image: character.image,
				tags: character.tags
			};
		},
	);

	const availableAccents = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.accent_ids : [],
		mappedBellShopRedeemedItems.length > 0 ? sortedBellShopItems[getBellShopCategories().find(c => c.name === constants.bellShop.categories.avatarAccents).id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map(ae => ae.accent_ids).flat() : [],
		avatarAccents,
		(accent) => {
			return {
				id: accent.id,
				name: accent.name,
				image: accent.image,
				positionable: accent.positionable,
				zIndex: accent.zIndex,
				tags: accent.tags
			};
		},
	);

	const availableColorations = getAvailableAvatars(
		mappedPerms,
		grantedAvatarPerms ? grantedAvatarPerms.coloration_ids : [],
		mappedBellShopRedeemedItems.length > 0 ? sortedBellShopItems[getBellShopCategories().find(c => c.name === constants.bellShop.categories.backgroundColorations).id].filter(c => mappedBellShopRedeemedItems.includes(c.id)).map(c => Number(c.internalId)) : [],
		availableIdsEvents.length > 0 ? availableIdsEvents.map(ae => ae.coloration_ids).flat() : [],
		avatarColorations,
		(coloration) => {
			return {
				id: coloration.id,
				name: coloration.name,
				css: coloration.css
			};
		},
	);

	let characterTags = [], accentTags = [], backgroundTags = [];
	const usedTags = [...new Set([...availableBackgrounds.usedTags, ...availableCharacters.usedTags, ...availableAccents.usedTags])];

	avatarTags.forEach(tag => {
		if (usedTags.includes(tag.id))
		{
			if (tag.forCharacter)
			{
				characterTags.push({
					id: tag.id,
					name: tag.name
				});
			}

			if (tag.forAccent)
			{
				accentTags.push({
					id: tag.id,
					name: tag.name
				});
			}

			if (tag.forBackground)
			{
				backgroundTags.push({
					id: tag.id,
					name: tag.name
				});
			}
		}
	});

	return {
		backgrounds: availableBackgrounds.available,
		accents: availableAccents.available,
		characters: availableCharacters.available,
		colorations: availableColorations.available,
		tags: {characterTags, accentTags, backgroundTags},
	}
}

/*
 * Get those avatars of each type that the user has access to.
 */
function getAvailableAvatars(grantedPerms, grantedAvatarPerms, bellShopRedeemedItems, availableIdsEvents, avatarTypes, transformFunc)
{
	let available = [], usedTags = [];

	for (const key in avatarTypes)
	{
		const at = avatarTypes[key];
		let checkDateRestricted = false, isAvailable = false;

		if (at.hasOwnProperty('permissions'))
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

			if (at.hasOwnProperty('tags'))
			{
				usedTags = [...new Set([...usedTags, ...at.tags])];
			}
		}
	}

	return {available, usedTags};
}