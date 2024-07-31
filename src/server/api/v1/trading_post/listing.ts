import * as db from '@db';
import { UserError } from '@errors';
import * as accounts from '@accounts';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

async function listing(this: APIThisType, {id}: listingProps) : Promise<ListingType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [[listing]] = await Promise.all([
		db.query(`
			SELECT
				listing.id,
				listing.creator_id,
				listing.created,
				listing.game_id,
				listing.last_updated,
				listing.type,
				listing.status
			FROM listing
			WHERE listing.id = $1::int
		`, id),
	]);

	if (!listing)
	{
		throw new UserError('no-such-listing');
	}

	const offerStatuses = constants.tradingPost.offerStatuses;

	const [birthDate, offers, comments, [listingOfferId], [offerAcceptedId], creator, creatorRatings, game] = await Promise.all([
		listing.game_id === null && this.userId != null ? accounts.getBirthDate(this.userId) : null,
		db.query(`
			SELECT
				listing_offer.id,
				listing_offer.status
			FROM listing_offer
			WHERE listing_offer.listing_id = $1::int AND listing_offer.user_id != $2::int
		`, listing.id, listing.creator_id),
		db.query(`
			SELECT
				listing_comment.id,
				listing_comment.user_id,
				listing_comment.created,
				listing_comment.comment,
				listing_comment.comment_format
			FROM listing_comment
			WHERE listing_comment.listing_id = $1::int
			ORDER BY listing_comment.created DESC
		`, listing.id),
		db.query(`
			SELECT
				listing_offer.id
			FROM listing_offer
			WHERE listing_offer.listing_id = $1::int AND listing_offer.user_id = $2::int
		`, listing.id, listing.creator_id),
		db.query(`
			SELECT
				listing_offer.id
			FROM listing_offer
			WHERE listing_offer.listing_id = $1::int AND listing_offer.user_id != $2::int AND listing_offer.status = $3
		`, listing.id, listing.creator_id, offerStatuses.accepted),
		this.query('v1/user', {id: listing.creator_id}),
		this.query('v1/users/ratings', {id: listing.creator_id}),
		listing.game_id ? this.query('v1/acgame', {id: listing.game_id}) : null,
		this.query('v1/notification/destroy', {
			id: id,
			type: 'listing'
		}),
	]);

	// confirm age
	if (birthDate != null)
	{
		if (dateUtils.getAge(birthDate) < constants.tradingPost.realTradeAge)
		{
			throw new UserError('permission');
		}
	}

	const [listingOffer, offerAccepted, offersList, commentsList] = await Promise.all([
		this.query('v1/trading_post/listing/offer', {id: listingOfferId.id}),
		offerAcceptedId ? this.query('v1/trading_post/listing/offer', {id: offerAcceptedId.id}) : null,
		Promise.all(offers.filter((offer:any) => offer.status !== offerStatuses.accepted).map(async (offer:any) => {
			return this.query('v1/trading_post/listing/offer', {id: offer.id});
		})),
		Promise.all(comments.map(async (comment:any) => {
			return {
				id: comment.id,
				user: await this.query('v1/user_lite', {id: comment.user_id}),
				formattedDate: dateUtils.formatDateTime(comment.created),
				comment: comment.comment,
				format: comment.comment_format,
			};
		})),
	]);

	return <ListingType>{
		id: listing.id,
		creator: {...creator, ...creatorRatings},
		formattedDate: dateUtils.formatDateTime(listing.created),
		game: game,
		offers: {
			total: offers.length,
			accepted: offerAccepted,
			list: offersList,
		},
		comments: commentsList,
		formattedLastUpdated: dateUtils.formatDateTime(listing.last_updated),
		bells: Number(listingOffer.bells),
		items: listingOffer.items,
		residents: listingOffer.residents,
		comment: listingOffer.comment,
		status: listing.status,
		rating: listingOffer.rating,
		type: listing.type,
		character: listingOffer.character,
		friendCode: listingOffer.friendCode,
		dodoCode: listingOffer.dodoCode,
		completed: listingOffer.completed,
		failed: listingOffer.failed,
		address: listingOffer.address,
		bioLocation: listingOffer.bioLocation,
	};
}

listing.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type listingProps = {
	id: number
}

export default listing;