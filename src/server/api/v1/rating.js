import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function rating({id})
{
	const [useFriendCodesPerm, useTradingPostPerm, viewRatingsPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'use-friend-codes'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'view-ratings'}),
	]);

	if (!(useFriendCodesPerm || useTradingPostPerm || viewRatingsPerm))
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
			rating.adoption_node_id
		FROM rating
		WHERE rating.id = $1::int
	`, id);

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
	};
}

rating.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default rating;