import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function failed({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const listing = await this.query('v1/trading_post/listing', {id: id});

	const listingStatuses = constants.tradingPost.listingStatuses;
	const offerStatuses = constants.tradingPost.offerStatuses;

	// only users involved in trade can mark it as failed
	// only if listing in right status
	if (![listing.creator.id, listing.offers.accepted.user.id].includes(this.userId) ||
		![listingStatuses.inProgress].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async query =>
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
				type: constants.notification.types.listingFailed
			}),
		]);
	});
}

failed.apiTypes = {
	id: {
		type: APITypes.listingId,
	},
}

export default failed;