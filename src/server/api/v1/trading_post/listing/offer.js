import * as db from '@db';
import { UserError } from '@errors';
import { sortedAcGameCategories as sortedCategories } from '@/catalog/data.js';
import { sortedCategories as sortedItemCategories } from '@/catalog/data.js';
import { constants, dateUtils } from '@utils';
import * as accounts from '@accounts';
import { residents as sortedResidents } from '@/catalog/residents.js';
import * as APITypes from '@apiTypes';

async function offer({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [offer] = await db.query(`
		SELECT
			listing_offer.id,
			sequence.sequence,
			listing_offer.user_id,
			listing_offer.created,
			listing_offer.status,
			listing_offer.bells,
			listing_offer.comment,
			listing_offer.rating_id,
			listing_offer.character_id,
			listing_offer.friend_code,
			listing_offer.dodo_code,
			listing_offer.completed,
			listing.game_id,
			listing_offer.failed,
			character.name AS character_name,
			town.id AS town_id,
			town.name AS town_name,
			listing.status AS listing_status,
			listing.creator_id,
			listing_offer.listing_id
		FROM listing_offer
		JOIN listing ON (listing.id = listing_offer.listing_id)
		LEFT JOIN character ON (listing_offer.character_id = character.id)
		LEFT JOIN town ON (town.id = character.town_id)
		JOIN (
			SELECT lo.id, ROW_NUMBER() OVER () AS sequence
			FROM listing_offer AS lo
			WHERE lo.listing_id = (SELECT listing_id FROM listing_offer WHERE id = $1::int)
			ORDER BY lo.id ASC
		) AS sequence ON (sequence.id = listing_offer.id)
		WHERE listing_offer.id = $1::int
	`, id);

	if (!offer)
	{
		throw new UserError('no-such-offer');
	}

	let catalogItems = [], realCatalogItems = [];

	// some older ACC 1 trades allowed GC-Real World
	if (offer.game_id === constants.gameIds.ACGC || !offer.game_id)
	{
		realCatalogItems = sortedItemCategories['all']['items'];
	}

	if (offer.game_id)
	{
		catalogItems = sortedCategories[offer.game_id]['all']['items'];
	}

	const offerStatuses = constants.tradingPost.offerStatuses;
	const listingStatuses = constants.tradingPost.listingStatuses;

	const [items, bio, [offerAccepted], offerResidents, user, rating] = await Promise.all([
		db.query(`
			SELECT
				listing_offer_catalog_item.catalog_item_id,
				listing_offer_catalog_item.quantity,
				listing_offer_catalog_item.secret_code
			FROM listing_offer_catalog_item
			WHERE listing_offer_catalog_item.listing_offer_id = $1::int
		`, offer.id),
		this.userId ? this.query('v1/users/bio', {id: offer.user_id}) : null,
		db.query(`
			SELECT
				listing_offer.user_id
			FROM listing_offer
			WHERE listing_offer.listing_id = $1::int AND listing_offer.user_id != $2::int AND listing_offer.status = $3
		`, offer.listing_id, offer.creator_id, offerStatuses.accepted),
		db.query(`
			SELECT
				resident_id
			FROM listing_offer_resident
			WHERE listing_offer_resident.listing_offer_id = $1::int
		`, offer.id),
		this.query('v1/user', {id: offer.user_id}),
		offer.rating_id ? this.query('v1/rating', {id: offer.rating_id}) : null,
	]);

	let character = null;

	if (offer.character_id > 0)
	{
		character = {
			id: offer.character_id,
			name: offer.character_name,
			town: {
				id: offer.town_id,
				name: offer.town_name,
			},
		};
	}

	var address = null;

	// if Offer Accepted and user is the offer's user
	// OR if In Progress and user is listing's user OR offer's user
	if ((offer.listing_status === listingStatuses.offerAccepted && this.userId === offer.user_id) ||
		(offer.listing_status === listingStatuses.inProgress &&
			(this.userId === offerAccepted?.user_id || this.userId === offer.creator_id)))
	{
		address = (await accounts.getUserData(offer.user_id)).address;
	}

	const offerResidentIds = offerResidents.map(or => or.resident_id);

	return {
		id: offer.id,
		sequence: Number(offer.sequence)-1,
		user: user,
		formattedDate: dateUtils.formatDateTime(offer.created),
		status: offer.status,
		bells: Number(offer.bells),
		items: items.map(item => {
			return {
				id: item.catalog_item_id,
				quantity: item.quantity,
				secretCode: item.secret_code,
				name: catalogItems.concat(realCatalogItems).find(ci => ci.id === item.catalog_item_id).name,
			};
		}),
		residents: offerResidentIds.length === 0 ? [] : sortedResidents[offer.game_id].filter(r => offerResidentIds.includes(r.id)),
		comment: offer.comment,
		rating: rating,
		character: character,
		friendCode: offer.friend_code,
		dodoCode: offer.dodo_code,
		completed: offer.completed,
		failed: offer.failed,
		address: address ? address : '',
		bioLocation: this.userId ? bio.location : null,
	};
}

offer.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default offer;