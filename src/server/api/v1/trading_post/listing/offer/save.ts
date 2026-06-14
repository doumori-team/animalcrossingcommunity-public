import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, ListingType, ACGameItemType } from '@types';

async function save(this: APIThisType, { id, bells, items, quantities, residents, comment }: saveProps): Promise<{ id: number }>
{
	// Check parameters
	const listing: ListingType = await this.query('v1/trading_post/listing', { id: id });

	const listingStatuses = constants.tradingPost.listingStatuses;
	const offerStatuses = constants.tradingPost.offerStatuses;

	if (listing.creator.id === this.userId ||
		listing.status !== listingStatuses.open ||
		listing.offers.list.find(x => x.user.id === this.userId && x.status !== offerStatuses.cancelled))
	{
		throw new UserError('permission');
	}

	// confirm age
	if (!listing.game)
	{
		const birthDate = await accounts.getBirthDate(this.userId as number);

		if (dateUtils.getAge(birthDate) < constants.tradingPost.realTradeAge)
		{
			throw new UserError('permission');
		}
	}

	const catalogItems: ACGameItemType[number]['all']['items'] = listing.game ?
		(await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${listing.game.id}_all_items`)).filter((item: ACGameItemType[number]['all']['items'][number]) => item.tradeable) :
		(await ACCCache.get(constants.cacheKeys.sortedCategories))['all']['items'];

	items = items.map((id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	});

	const gameId = listing.game ? listing.game.id : 0;

	// Confirm quantities is correct
	// If not GC and we have items, make sure they match & it's not completely empty
	if (gameId !== constants.gameIds.ACGC && items.length > 0 &&
		(quantities.length !== items.length || quantities.filter(q => q > 0).length === 0))
	{
		throw new UserError('bad-format');
	}

	// AC:GC / real must only have items, all others must have at least bells OR items OR residents OR a comment
	if (gameId === constants.gameIds.ACGC && (utils.safeNumber(bells) > 0 || residents.length > 0 || utils.realStringLength(comment) > 0 || items.length <= 0) ||
		gameId > constants.gameIds.ACGC && (utils.safeNumber(bells) <= 0 && residents.length <= 0 && utils.realStringLength(comment) <= 0 && items.length <= 0) ||
		gameId === 0 && (utils.safeNumber(bells) > 0 || residents.length > 0 || utils.realStringLength(comment) > 0 || items.length <= 0))
	{
		throw new UserError('bad-format');
	}

	if (items.length > constants.tradingPost.maxItems || residents.length > constants.tradingPost.maxItems)
	{
		throw new UserError('too-many-items');
	}

	const [blocked] = await db.query(`
		SELECT user_id
		FROM block_user
		WHERE block_user_id = $1::int AND user_id = $2::int
	`, this.userId, listing.creator.id);

	if (blocked)
	{
		throw new UserError('blocked');
	}

	// Perform queries
	const listingOfferId = await db.transaction(async (query: db.QueryType) =>
	{
		const [listingOffer] = await query(`
			INSERT INTO listing_offer (user_id, listing_id, bells, status, comment)
			VALUES ($1::int, $2::int, $3, $4, $5)
			RETURNING id
		`, this.userId, id, bells, offerStatuses.pending, comment);

		const listingOfferId = listingOffer.id;

		await Promise.all([
			updateItems(listingOfferId, gameId, items, quantities, query),
			updateResidents(listingOfferId, residents, query),
			db.query(`
				UPDATE listing
				SET last_updated = NOW()
				WHERE id = $1::int
			`, id),
			this.query('v1/notification/create', {
				id: id,
				type: constants.notification.types.listingOffer,
			}),
		]);

		return listingOfferId;
	});

	return {
		id: listingOfferId,
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
	id: {
		type: APITypes.listingId,
	},
	bells: {
		type: APITypes.number,
		nullable: true,
		max: constants.max.number,
	},
	items: {
		type: APITypes.array,
	},
	quantities: {
		type: APITypes.array,
		subType: 'number',
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
	id: number
	bells: number | null
	items: string[]
	quantities: number[]
	residents: string[]
	comment: string
};

export default save;
