import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

/*
 * Retrieves trading post offers a specific user has given.
 */
async function offers({id, page})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-trading-post'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const offerStatuses = constants.tradingPost.offerStatuses;

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;

	const results = await db.query(`
		SELECT
			listing_offer.listing_id,
			count(*) over() AS count
		FROM listing_offer
		JOIN listing ON (listing.id = listing_offer.listing_id)
		WHERE listing_offer.user_id = $3::int AND listing_offer.user_id != listing.creator_id AND listing_offer.status = ANY($4)
		ORDER BY listing.last_updated DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, id, [offerStatuses.pending, offerStatuses.onHold, offerStatuses.accepted]);

	const offers = await Promise.all(results.map(async(offer) => {
		return this.query('v1/trading_post/listing', {id: offer.listing_id})
	}));

	return {
		results: offers,
		count: offers.length > 0 ? Number(results[0].count) : 0,
		page: page,
		pageSize: pageSize,
	};
}

offers.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
}

export default offers;