import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ListingType } from '@types';

async function failed(this: APIThisType, { id }: failedProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-trading-post' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const listing: ListingType = await this.query('v1/trading_post/listing', { id: id });

	const listingStatuses = constants.tradingPost.listingStatuses;
	const offerStatuses = constants.tradingPost.offerStatuses;

	// only users involved in trade can mark it as failed
	// only if listing in right status
	if (![listing.creator.id, listing.offers.accepted?.user.id].includes(this.userId) ||
		![listingStatuses.inProgress].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				UPDATE listing_offer
				SET failed = true
				WHERE listing_id = $1::int AND user_id = $2::int
			`, id, this.userId),
			query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, id, listingStatuses.failed),
			query(`
				UPDATE listing_offer
				SET status = $2
				WHERE listing_id = $1::int AND status = $3
			`, id, offerStatuses.rejected, offerStatuses.onHold),
			this.query('v1/notification/create', {
				id: id,
				type: constants.notification.types.listingFailed,
			}),
		]);
	});
}

failed.apiTypes = {
	id: {
		type: APITypes.listingId,
		required: true,
	},
};

type failedProps = {
	id: number
};

export default failed;
