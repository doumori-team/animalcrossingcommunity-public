import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

async function accept(this: APIThisType, {id}: acceptProps) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	const [offer] = await db.query(`
		SELECT
			listing_id,
			status,
			user_id
		FROM listing_offer
		WHERE id = $1::int
	`, id);

	if (!offer)
	{
		throw new UserError('no-such-offer');
	}

	const listing:ListingType = await this.query('v1/trading_post/listing', {id: offer.listing_id});

	const listingStatuses = constants.tradingPost.listingStatuses;
	const offerStatuses = constants.tradingPost.offerStatuses;

	// Can't update offer if:
	// currently logged in user isn't the offer's user
	// offer is the listing offer
	// there is an accepted offer
	// offer is already rejected / cancelled
	// listing isn't in right status
	if (listing.creator.id !== this.userId ||
		offer.user_id === listing.creator.id ||
		listing.offers.accepted ||
		[offerStatuses.rejected, offerStatuses.cancelled].includes(offer.status) ||
		![listingStatuses.open, listingStatuses.offerAccepted, listingStatuses.inProgress].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query:any) =>
	{
		await Promise.all([
			query(`
				UPDATE listing_offer
				SET status = $2
				WHERE id = $1::int
			`, id, offerStatuses.accepted),
			query(`
				UPDATE listing_offer
				SET status = $3
				WHERE id != $1::int AND listing_id = $2::int AND status = $4
			`, id, listing.id, offerStatuses.onHold, offerStatuses.pending),
			query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, listing.id, listingStatuses.offerAccepted),
		]);
	});

	await db.transaction(async (query:any) =>
	{
		if (!listing.game)
		{
			const updatedListing:ListingType = await this.query('v1/trading_post/listing', {id: listing.id});

			if (updatedListing.address && updatedListing.offers.accepted?.address)
			{
				await query(`
					UPDATE listing
					SET status = $2
					WHERE id = $1::int
				`, listing.id, listingStatuses.inProgress);
			}
		}
	});

	await this.query('v1/notification/create', {
		id: id,
		type: constants.notification.types.listingOfferAccepted
	});
}

accept.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type acceptProps = {
	id: number
}

export default accept;