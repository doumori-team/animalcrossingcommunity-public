import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, UserListingsType } from '@types';

async function listings(this: APIThisType, { id, page }: listingsProps): Promise<UserListingsType>
{
	const pageSize = 24;
	const offset = page * pageSize - pageSize;

	const results: { id: number, count: number }[] = await db.query(`
		SELECT
			listing.id,
			count(*) over() AS count
		FROM listing
		WHERE listing.creator_id = $3::int
		ORDER BY listing.last_updated DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, id);

	const listings = await Promise.all(results.map(async listing =>
	{
		return this.query('v1/trading_post/listing', { id: listing.id });
	}));

	return {
		results: listings,
		count: listings.length > 0 ? Number(results[0].count) : 0,
		page: page,
		pageSize: pageSize,
	};
}

listings.permissions = [
	'use-trading-post',
];

listings.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
};

type listingsProps = {
	id: number
	page: number
};

export default listings;
