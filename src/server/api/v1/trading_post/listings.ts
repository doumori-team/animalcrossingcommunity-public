import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as accounts from '@accounts';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingsType, CatalogItemsType, CharacterType } from '@types';

async function listings(this: APIThisType, { page, creator, type, gameId, bells, items, villagers,
	active, wishlist, bioLocation, comment }: listingsProps): Promise<ListingsType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-trading-post' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId && page > 1)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	// confirm age
	let age = 0;

	if (gameId <= 0 && this.userId)
	{
		const birthDate = await accounts.getBirthDate(this.userId);
		age = dateUtils.getAge(birthDate);

		if (gameId === 0 && age < constants.tradingPost.realTradeAge)
		{
			throw new UserError('permission');
		}
	}

	items = items.map((id: any) =>
	{
		return String(id).trim();
	});

	villagers = villagers.map((id: any) =>
	{
		return String(id);
	});

	const listingStatuses = constants.tradingPost.listingStatuses;

	// Do actual search
	const pageSize = 25;
	const offset = page * pageSize - pageSize;
	let params: any = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			listing.id,
			count(*) over() AS count
		FROM listing
	`;

	// Add joins
	if (utils.realStringLength(creator) > 0)
	{
		query += `
			JOIN user_account_cache ON (user_account_cache.id = listing.creator_id)
		`;
	}

	if (bells != null && bells > 0 || items.length > 0 || villagers.length > 0 || utils.realStringLength(comment) > 0)
	{
		query += `
			JOIN listing_offer ON (listing.id = listing_offer.listing_id AND listing_offer.user_id = listing.creator_id)
		`;
	}

	if (items.length > 0)
	{
		query += `
			LEFT JOIN listing_offer_catalog_item ON (listing_offer.id = listing_offer_catalog_item.listing_offer_id)
		`;
	}

	if (villagers.length > 0)
	{
		query += `
			JOIN listing_offer_resident ON (listing_offer.id = listing_offer_resident.listing_offer_id)
		`;
	}

	if (active != null && active > 0 || utils.realStringLength(bioLocation) > 0)
	{
		query += `
			JOIN users ON (users.id = listing.creator_id)
		`;
	}

	// Add wheres
	let wheres = [];

	wheres.push(`listing.status = '` + listingStatuses.open + `'`);

	if (utils.realStringLength(creator) > 0)
	{
		params[paramIndex] = creator;

		paramIndex++;

		wheres.push(`LOWER(user_account_cache.username) = LOWER($` + paramIndex + `)`);
	}

	if ([constants.tradingPost.listingTypes.sell, constants.tradingPost.listingTypes.buy].includes(type))
	{
		params[paramIndex] = type.charAt(0).toUpperCase() + type.slice(1);

		paramIndex++;

		wheres.push(`listing.type = $` + paramIndex);
	}

	if (gameId > 0)
	{
		params[paramIndex] = gameId;

		paramIndex++;

		wheres.push(`listing.game_id = $` + paramIndex);
	}
	else if (gameId === 0 && age >= constants.tradingPost.realTradeAge)
	{
		wheres.push(`listing.game_id IS NULL`);
	}
	else if (gameId <= 0 && age < constants.tradingPost.realTradeAge)
	{
		wheres.push(`listing.game_id IS NOT NULL`);
	}

	if (bells != null && bells > 0)
	{
		params[paramIndex] = bells;

		paramIndex++;

		wheres.push(`listing_offer.bells >= $` + paramIndex);
	}

	if (items.length > 0)
	{
		params[paramIndex] = items;

		paramIndex++;

		wheres.push(`listing_offer_catalog_item.catalog_item_id = ANY($` + paramIndex + `)`);
	}

	if (villagers.length > 0)
	{
		params[paramIndex] = villagers;

		paramIndex++;

		wheres.push(`listing_offer_resident.resident_id = ANY($` + paramIndex + `)`);
	}

	if (active != null && active > 0)
	{
		params[paramIndex] = active;

		paramIndex++;

		wheres.push(`users.last_active_time > (now() - interval '1 day' * $` + paramIndex + `)`);
	}

	if (wishlist)
	{
		// check where user searching's wishlist matches listings with their items
		let wishlistItemsSearch: any = [];

		if (gameId === 0)
		{
			const userCatalogItems: CatalogItemsType[] = await this.query('v1/users/catalog', { id: this.userId });
			wishlistItemsSearch = userCatalogItems.filter((item: any) => item.isWishlist);
		}
		else if (gameId > 0)
		{
			const characters: CharacterType[] = await this.query('v1/users/characters', { id: this.userId });

			wishlistItemsSearch = (await Promise.all(characters.filter((c: any) => c.game.id === gameId).map(async (character: any) =>
			{
				const catalog: CatalogItemsType[] = await this.query('v1/character/catalog', { id: character.id });

				return catalog.filter((item: any) => item.isWishlist);
			}))).flat(2).map(i => i.id);
		}

		if (wishlistItemsSearch.length > 0)
		{
			const wishlistItemListingIds = (await db.query(`
				SELECT
					listing.id
				FROM listing
				JOIN listing_offer ON (listing_offer.listing_id = listing.id AND listing_offer.user_id = listing.creator_id)
				JOIN listing_offer_catalog_item ON (listing_offer_catalog_item.listing_offer_id = listing_offer.id)
				WHERE listing.status = $2 AND listing_offer_catalog_item.catalog_item_id = ANY($1)
			`, wishlistItemsSearch, listingStatuses.open)).map((l: any) => l.id);

			params[paramIndex] = wishlistItemListingIds;

			paramIndex++;

			wheres.push(`listing.id = ANY($` + paramIndex + `)`);
		}
		else
		{
			wheres.push(`listing.id = 0`);
		}
	}

	if (utils.realStringLength(bioLocation) > 0)
	{
		params[paramIndex] = '%' + bioLocation + '%';

		paramIndex++;

		wheres.push(`users.bio_location ilike $` + bioLocation);
	}

	if (utils.realStringLength(comment) > 0)
	{
		params[paramIndex] = '%' + comment + '%';

		paramIndex++;

		wheres.push(`listing_offer.comment ilike $` + paramIndex);
	}

	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (Number(key) > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		ORDER BY listing.created DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const listings = await db.query(query, ...params);

	if (listings.length > 0)
	{
		const nonDupListingIds = listings.filter((v: any,i: any,a: any) => a.findIndex((t: any) => t.id === v.id) === i).map((l: any) => l.id);

		results = await Promise.all(nonDupListingIds.map(async (listingId: any) =>
		{
			return this.query('v1/trading_post/listing', { id: listingId });
		}));

		count = Number(listings[0].count);
	}

	return <ListingsType>{
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		creator: creator,
		type: type,
		gameId: gameId,
		bells: bells,
		items: items,
		villagers: villagers,
		active: active,
		wishlist: wishlist,
		bioLocation: bioLocation,
		comment: comment,
	};
}

listings.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	creator: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	type: {
		type: APITypes.string,
		default: '',
		includes: [constants.tradingPost.listingTypes.sell, constants.tradingPost.listingTypes.buy, constants.tradingPost.listingTypes.both],
		required: true,
	},
	gameId: {
		type: APITypes.acgameId,
		default: -1,
		nullable: true,
	},
	bells: {
		type: APITypes.number,
		nullable: true,
		max: constants.max.number,
	},
	items: {
		type: APITypes.array,
	},
	villagers: {
		type: APITypes.array,
	},
	active: {
		type: APITypes.number,
		nullable: true,
		max: constants.max.active,
	},
	wishlist: {
		type: APITypes.boolean,
		default: 'false',
	},
	bioLocation: {
		type: APITypes.string,
		default: '',
		length: constants.max.location,
		profanity: true,
	},
	comment: {
		type: APITypes.string,
		default: '',
		length: constants.max.additionalInfo,
		profanity: true,
	},
};

type listingsProps = {
	page: number
	creator: string
	type: string
	gameId: number
	bells: number | null
	items: any[]
	villagers: any[]
	active: number | null
	wishlist: boolean
	bioLocation: string
	comment: string
};

export default listings;
