import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function expired({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	const [listing] = await db.query(`
		SELECT
			listing.status,
			listing.creator_id
		FROM listing
		WHERE listing.id = $1::int
	`, id);

	const listingStatuses = constants.tradingPost.listingStatuses;

	if (![listingStatuses.open, listingStatuses.offerAccepted].includes(listing.status))
	{
		return false;
	}

	// Check if listing should be expired
	const user = await this.query('v1/user', {id: listing.creator_id});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (dateUtils.isAfterTimezone(user.lastActiveTime, dateUtils.subtractFromCurrentDateTimezone(constants.tradingPost.tradeExpiry, 'days')))
	{
		return false;
	}

	// Update listing to expired
	await db.transaction(async query =>
	{
		const offerStatuses = constants.tradingPost.offerStatuses;

		await Promise.all([
			query(`
				UPDATE listing
				SET status = $2, last_updated = NOW()
				WHERE id = $1::int
			`, id, listingStatuses.expired),
			query(`
				UPDATE listing_offer
				SET status = $2
				WHERE listing_id = $1::int
			`, id, offerStatuses.rejected),
			this.query('v1/notification/create', {
				id: id,
				type: constants.notification.types.listingExpired
			}),
		]);
	});
}

expired.apiTypes = {
	id: {
		type: APITypes.listingId,
	},
}

export default expired;