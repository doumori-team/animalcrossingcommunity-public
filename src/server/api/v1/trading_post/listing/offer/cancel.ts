import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

async function cancel(this: APIThisType, { id }: cancelProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-trading-post' });

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

	const listing: ListingType = await this.query('v1/trading_post/listing', { id: offer.listing_id });

	const offerStatuses = constants.tradingPost.offerStatuses;
	const listingStatuses = constants.tradingPost.listingStatuses;

	// Can't update offer if:
	// offer wasn't made by currently logged in user
	// offer is the listing offer
	// offer is already rejected / cancelled
	// listing isn't in right status
	if (offer.user_id !== this.userId ||
		offer.user_id === listing.creator.id ||
		[offerStatuses.rejected, offerStatuses.cancelled].includes(offer.status) ||
		![listingStatuses.open, listingStatuses.offerAccepted].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				UPDATE listing_offer
				SET status = $2
				WHERE id = $1::int
			`, id, offerStatuses.cancelled),
			offer.status === offerStatuses.accepted ? query(`
				UPDATE listing_offer
				SET status = $3
				WHERE id != $1::int AND listing_id = $2::int AND status = $4
			`, id, listing.id, offerStatuses.pending, offerStatuses.onHold) : null,
			offer.status === offerStatuses.accepted ? query(`
				UPDATE listing
				SET status = $2
				WHERE id = $1::int
			`, listing.id, listingStatuses.open) : null,
			query(`
				UPDATE listing
				SET last_updated = NOW()
				WHERE id = $1::int
			`, listing.id),
		]);
	});

	await this.query('v1/notification/create', {
		id: listing.id,
		type: constants.notification.types.listingOfferCancelled,
	});
}

cancel.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type cancelProps = {
	id: number
};

export default cancel;
