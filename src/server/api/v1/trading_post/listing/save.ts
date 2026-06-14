import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType } from '@types';

async function save(this: APIThisType, { gameId, type, items, quantities, bells, residents, comment }: saveProps): Promise<{ id: number }>
{
	// Check parameters
	if (gameId > 0)
	{
		let [checkId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int
		`, gameId);

		if (!checkId)
		{
			throw new UserError('no-such-ac-game');
		}
	}
	// confirm age
	else
	{
		const birthDate = await accounts.getBirthDate(this.userId as number);

		if (dateUtils.getAge(birthDate) < constants.tradingPost.realTradeAge)
		{
			throw new UserError('permission');
		}
	}

	const catalogItems: ACGameItemType[number]['all']['items'] = gameId > 0 ?
		(await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: ACGameItemType[number]['all']['items'][number]) => item.tradeable) :
		(await ACCCache.get(constants.cacheKeys.sortedCategories))['all']['items'];

	items = items.map((id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	});

	// Confirm quantities is correct
	// If not GC and we have items, make sure they match & it's not completely empty
	if (gameId !== constants.gameIds.ACGC && items.length > 0 &&
		(quantities.length !== items.length || quantities.filter(q => q > 0 && q <= 2000000000).length === 0))
	{
		throw new UserError('bad-format');
	}

	// AC:GC / real must only have items, all others must have at least bells OR items OR residents OR a comment
	if (gameId === constants.gameIds.ACGC && (utils.safeNumber(bells) > 0 || residents.length > 0 || utils.realStringLength(comment) > 0 || items.length <= 0) ||
	utils.safeNumber(gameId) > constants.gameIds.ACGC && (utils.safeNumber(bells) <= 0 && residents.length <= 0 && utils.realStringLength(comment) <= 0 && items.length <= 0) ||
		gameId === 0 && (utils.safeNumber(bells) > 0 || residents.length > 0 || utils.realStringLength(comment) > 0 || items.length <= 0))
	{
		throw new UserError('bad-format');
	}

	if (items.length > constants.tradingPost.maxItems || residents.length > constants.tradingPost.maxItems)
	{
		throw new UserError('too-many-items');
	}

	const listingStatuses = constants.tradingPost.listingStatuses;
	const offerStatuses = constants.tradingPost.offerStatuses;

	// Run queries
	const listing = await db.transaction(async (query: db.QueryType) =>
	{
		const [listing] = await query(`
			INSERT INTO listing (creator_id, status, game_id, type)
			VALUES ($1::int, $2, $3::int, $4)
			RETURNING id
		`, this.userId, listingStatuses.open, gameId > 0 ? gameId : null, type);

		const [listingOffer] = await query(`
			INSERT INTO listing_offer (user_id, listing_id, bells, status, comment)
			VALUES ($1::int, $2::int, $3, $4, $5)
			RETURNING id
		`, this.userId, listing.id, bells, offerStatuses.accepted, comment);

		const listingOfferId = listingOffer.id;

		await Promise.all([
			updateItems(listingOfferId, gameId, items, quantities, query),
			updateResidents(listingOfferId, residents, query),
		]);

		return listing;
	});

	return {
		id: listing.id,
	};
}

async function updateItems(listingOfferId: number, gameId: number, items: string[], quantities: number[], query: db.QueryType): Promise<void>
{
	if (items.length <= 0)
	{
		return;
	}

	await Promise.all([
		items.map(async(itemId, index) =>
		{
			const quantity = gameId === constants.gameIds.ACGC ? 1 : quantities[index];

			if (quantity > 0)
			{
				await query(`
					INSERT INTO listing_offer_catalog_item (listing_offer_id, catalog_item_id, quantity)
					VALUES ($1::int, $2, $3::int)
				`, listingOfferId, itemId, quantity);
			}
		}),
	]);
}

async function updateResidents(listingOfferId: number, residents: string[], query: db.QueryType): Promise<void>
{
	if (residents.length <= 0)
	{
		return;
	}

	await Promise.all([
		residents.map(async (residentId) =>
		{
			await query(`
				INSERT INTO listing_offer_resident (listing_offer_id, resident_id)
				VALUES ($1::int, $2)
			`, listingOfferId, residentId);
		}),
	]);
}

save.permissions = [
	'use-trading-post',
	'userId',
];

save.apiTypes = {
	gameId: {
		type: APITypes.acgameId,
		nullable: true,
	},
	type: {
		type: APITypes.string,
		default: '',
		includes: [constants.tradingPost.listingTypes.sell, constants.tradingPost.listingTypes.buy],
		required: true,
	},
	items: {
		type: APITypes.array,
	},
	quantities: {
		type: APITypes.array,
		subType: 'number',
	},
	bells: {
		type: APITypes.number,
		nullable: true,
		max: constants.max.number,
	},
	residents: {
		type: APITypes.array,
		subType: 'string',
	},
	comment: {
		type: APITypes.string,
		default: '',
		length: constants.max.additionalInfo,
		profanity: true,
	},
};

type saveProps = {
	gameId: number
	type: string
	items: string[]
	quantities: number[]
	bells: number | null
	residents: string[]
	comment: string
};

export default save;
