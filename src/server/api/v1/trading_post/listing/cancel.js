import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function cancel({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	const listing = await this.query('v1/trading_post/listing', {id: id});

	const listingStatuses = constants.tradingPost.listingStatuses;

	// Can't update listing if:
	// listing wasn't made by currently logged in user
	// listing isn't in right status
	if (listing.creator.id !== this.userId ||
		![listingStatuses.open, listingStatuses.offerAccepted].includes(listing.status))
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async query =>
	{
		const offerStatuses = constants.tradingPost.offerStatuses;

		await Promise.all([
			query(`
				UPDATE listing_offer
				SET status = $2
				WHERE listing_id = $1::int AND user_id != $3::int
			`, id, offerStatuses.rejected, listing.creator.id),
			query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, id, listingStatuses.cancelled),
			this.query('v1/notification/create', {
				id: id,
				type: constants.notification.types.listingCancelled
			}),
		]);
	});
}

cancel.apiTypes = {
	id: {
		type: APITypes.listingId,
	},
}

export default cancel;