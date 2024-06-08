import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function ratings({id})
{
	const currentUser = this.userId === id;
	let useTradingPostPerm = true, useFriendCodesPerm = true, scoutPagesPerm = true, viewShopsPerm = true;

	if (!currentUser)
	{
		[useTradingPostPerm, useFriendCodesPerm, scoutPagesPerm, viewShopsPerm] = await Promise.all([
			this.query('v1/permission', {permission: 'use-trading-post'}),
			this.query('v1/permission', {permission: 'use-friend-codes'}),
			this.query('v1/permission', {permission: 'scout-pages'}),
			this.query('v1/permission', {permission: 'view-shops'}),
		]);

		if (!(useTradingPostPerm || useFriendCodesPerm || scoutPagesPerm || viewShopsPerm))
		{
			throw new UserError('permission');
		}
	}

	const ratingConfig = constants.rating.configs;

	const [
		[positiveWifiRatings], [neutralWifiRatings], [negativeWifiRatings],
		[positiveTradeRatings], [neutralTradeRatings], [negativeTradeRatings],
		[positiveScoutRatings], [neutralScoutRatings], [negativeScoutRatings],
		[positiveShopRatings], [neutralShopRatings], [negativeShopRatings]
	] = await Promise.all([
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL AND shop_node_id IS NULL
		`, id, ratingConfig.positive.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL AND shop_node_id IS NULL
		`, id, ratingConfig.neutral.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL AND shop_node_id IS NULL
		`, id, ratingConfig.negative.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, id, ratingConfig.positive.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, id, ratingConfig.neutral.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, id, ratingConfig.negative.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, id, ratingConfig.positive.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, id, ratingConfig.neutral.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, id, ratingConfig.negative.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND shop_node_id IS NOT NULL
		`, id, ratingConfig.positive.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND shop_node_id IS NOT NULL
		`, id, ratingConfig.neutral.id),
		db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND shop_node_id IS NOT NULL
		`, id, ratingConfig.negative.id),
	]);

	return {
		id: id,
		positiveWifiRatingsTotal: useFriendCodesPerm ? positiveWifiRatings.count : 0,
		neutralWifiRatingsTotal: useFriendCodesPerm ? neutralWifiRatings.count : 0,
		negativeWifiRatingsTotal: useFriendCodesPerm ? negativeWifiRatings.count : 0,
		positiveTradeRatingsTotal: useTradingPostPerm ? positiveTradeRatings.count : 0,
		neutralTradeRatingsTotal: useTradingPostPerm ? neutralTradeRatings.count : 0,
		negativeTradeRatingsTotal: useTradingPostPerm ? negativeTradeRatings.count : 0,
		positiveScoutRatingsTotal: scoutPagesPerm ? positiveScoutRatings.count : 0,
		neutralScoutRatingsTotal: scoutPagesPerm ? neutralScoutRatings.count : 0,
		negativeScoutRatingsTotal: scoutPagesPerm ? negativeScoutRatings.count : 0,
		positiveShopRatingsTotal: viewShopsPerm ? positiveShopRatings.count : 0,
		neutralShopRatingsTotal: viewShopsPerm ? neutralShopRatings.count : 0,
		negativeShopRatingsTotal: viewShopsPerm ? negativeShopRatings.count : 0,
	};
}

ratings.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default ratings;