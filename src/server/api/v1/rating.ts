import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, RatingType, UserLiteType } from '@types';

async function rating(this: APIThisType, { id }: ratingProps): Promise<RatingType>
{
	// Perform queries
	const [rating] = await db.query(`
		SELECT
			rating.id,
			rating.user_id,
			rating.rating_user_id,
			rating.last_updated,
			rating.rating,
			rating.comment,
			rating.listing_id,
			rating.adoption_node_id,
			rating.shop_node_id,
			user_node_permission.granted
		FROM rating
		LEFT JOIN user_node_permission ON (user_node_permission.node_id = rating.shop_node_id AND user_node_permission.user_id = $2 AND user_node_permission.node_permission_id = $3)
		WHERE rating.id = $1::int
	`, id, this.userId, constants.nodePermissions.read);

	if (!rating)
	{
		throw new UserError('no-such-rating');
	}

	if (rating.adoption_node_id)
	{
		const permissionGranted: boolean = await this.query('v1/permission', { permission: 'scout-pages' });

		if (!permissionGranted && this.userId !== rating.user_id)
		{
			throw new UserError('permission');
		}
	}

	const types = constants.notification.types;

	const [user, ratingUser]: [UserLiteType, UserLiteType, void, void] = await Promise.all([
		this.query('v1/user_lite', { id: rating.user_id }),
		this.query('v1/user_lite', { id: rating.rating_user_id }),
		rating.listing_id ? this.query('v1/notification/destroy', {
			id: rating.listing_id,
			type: types.listingFeedback,
		}) : null,
		rating.adoption_node_id ? this.query('v1/notification/destroy', {
			id: rating.adoption_node_id,
			type: types.scoutFeedback,
		}) : null,
	]);

	return <RatingType>{
		id: rating.id,
		username: user.username,
		ratingUsername: ratingUser.username,
		formattedDate: dateUtils.formatDateTime5(rating.last_updated),
		rating: rating.rating,
		comment: rating.comment,
		listingId: rating.listing_id,
		adoptionNodeId: rating.adoption_node_id,
		shopNodeId: rating.granted ? rating.shop_node_id : null,
	};
}

rating.permissions = [
	'use-friend-codes',
	'use-trading-post',
	'view-ratings',
	'view-shops',
	'userId',
];

rating.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type ratingProps = {
	id: number
};

export default rating;
