import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, RatingsGivenType } from '@types';

async function ratings_given(this: APIThisType, { id, page, type }: ratingsGivenProps): Promise<RatingsGivenType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-ratings' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	if ([constants.rating.types.scout].includes(type) && this.userId !== id)
	{
		throw new UserError('permission');
	}

	// Perform queries
	const pageSize = 25;
	const offset = page * pageSize - pageSize;

	let query = `
		SELECT
			rating.id,
			count(*) over() AS count
		FROM rating
	`;

	if (type === constants.rating.types.wifi)
	{
		query += `
			WHERE rating.user_id = $3::int AND listing_id IS NULL AND adoption_node_id IS NULL AND shop_node_id IS NULL
		`;
	}
	else if (type === constants.rating.types.trade)
	{
		query += `
			WHERE rating.user_id = $3::int AND listing_id IS NOT NULL
		`;
	}
	else if (type === constants.rating.types.scout)
	{
		query += `
			WHERE rating.user_id = $3::int AND adoption_node_id IS NOT NULL
		`;
	}
	else if (type === constants.rating.types.shop)
	{
		query += `
			WHERE rating.user_id = $3::int AND shop_node_id IS NOT NULL
		`;
	}

	query += `
		ORDER BY rating.last_updated DESC
		LIMIT $1::int OFFSET $2::int
	`;

	const ratings = await db.query(query, pageSize, offset, id);

	return {
		results: await Promise.all(ratings.map(async (rating: any) =>
		{
			return this.query('v1/rating', { id: rating.id });
		})),
		count: ratings.length > 0 ? Number(ratings[0].count) : 0,
		page: page,
		pageSize: pageSize,
		type: type,
	};
}

ratings_given.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	type: {
		type: APITypes.string,
		default: '',
		includes: [constants.rating.types.wifi, constants.rating.types.trade, constants.rating.types.scout, constants.rating.types.shop],
		required: true,
	},
};

type ratingsGivenProps = {
	id: number
	page: number
	type: string
};

export default ratings_given;
