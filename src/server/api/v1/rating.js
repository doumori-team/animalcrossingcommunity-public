import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function rating({id})
{
	const [useFriendCodesPerm, useTradingPostPerm, viewRatingsPerm, viewShopsPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'use-friend-codes'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'view-ratings'}),
		this.query('v1/permission', {permission: 'view-shops'}),
	]);

	if (!(useFriendCodesPerm || useTradingPostPerm || viewRatingsPerm || viewShopsPerm))
	{
		throw new UserError('permission');
	}

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
		const permissionGranted = await this.query('v1/permission', {permission: 'scout-pages'});

		if (!permissionGranted && this.userId !== rating.user_id)
		{
			throw new UserError('permission');
		}
	}

	const types = constants.notification.types;

	const [user, ratingUser] = await Promise.all([
		this.query('v1/user_lite', {id: rating.user_id}),
		this.query('v1/user_lite', {id: rating.rating_user_id}),
		rating.listing_id ? this.query('v1/notification/destroy', {
			id: rating.listing_id,
			type: types.listingFeedback
		}) : null,
		rating.adoption_node_id ? this.query('v1/notification/destroy', {
			id: rating.adoption_node_id,
			type: types.scoutFeedback
		}) : null,
	]);

	return {
		id: rating.id,
		username: user.username,
		ratingUsername: ratingUser.username,
		formattedDate: dateUtils.formatDateTimezone(rating.last_updated),
		rating: rating.rating,
		comment: rating.comment,
		listingId: rating.listing_id,
		adoptionNodeId: rating.adoption_node_id,
		shopNodeId: rating.granted ? rating.shop_node_id : null,
	};
}

rating.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default rating;