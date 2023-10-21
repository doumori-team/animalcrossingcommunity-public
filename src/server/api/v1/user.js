import * as db from '@db';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import * as accounts from '@accounts';

/*
 * Extracts a user's information. Anything more then id / username.
 */
async function user({id, username})
{
	if (isNaN(id))
	{
		if (typeof(username) === 'undefined')
		{
			id = this.userId;
		}
		else
		{
			id = undefined;
		}
	}

	const accountData = await accounts.getData(id, username);

	const currentUser = this.userId === accountData.id;
	let reassignAdopteesPerm = true, useBuddySystemPerm = true, accForumsPerm = true, useTradingPostPerm = true, processUserTicketsPerm = true, viewProfiles = true, purchaseBellShopPerm = true, reportContentPerm = true, permissionAdminPerm = true, useFriendCodesPerm = true, scoutPagesPerm = true;

	if (!currentUser)
	{
		[reassignAdopteesPerm, useBuddySystemPerm, accForumsPerm, useTradingPostPerm, processUserTicketsPerm, viewProfiles, purchaseBellShopPerm, reportContentPerm, permissionAdminPerm, useFriendCodesPerm, scoutPagesPerm] = await Promise.all([
			this.query('v1/permission', {permission: 'adoption-reassign'}),
			this.query('v1/permission', {permission: 'use-buddy-system'}),
			this.query('v1/node/permission', {permission: 'read', nodeId: constants.boardIds.accForums}),
			this.query('v1/permission', {permission: 'use-trading-post'}),
			this.query('v1/permission', {permission: 'process-user-tickets'}),
			this.query('v1/permission', {permission: 'view-profiles'}),
			this.query('v1/permission', {permission: 'purchase-bell-shop'}),
			this.query('v1/permission', {permission: 'report-content'}),
			this.query('v1/permission', {permission: 'permission-admin'}),
			this.query('v1/permission', {permission: 'use-friend-codes'}),
			this.query('v1/permission', {permission: 'scout-pages'}),
		]);

		if (!(reassignAdopteesPerm || useBuddySystemPerm || accForumsPerm || useTradingPostPerm || processUserTicketsPerm || viewProfiles || purchaseBellShopPerm || reportContentPerm || permissionAdminPerm || useFriendCodesPerm || scoutPagesPerm))
		{
			throw new UserError('permission');
		}
	}

	const ratingConfig = constants.rating.configs;
	const adopteeThreadId = constants.boardIds.adopteeBT;

	const [
		avatar, [group], [profileInfo], [positiveWifiRatings], [neutralWifiRatings],
		[negativeWifiRatings], [positiveTradeRatings], [neutralTradeRatings],
		[negativeTradeRatings], [treasure], [missedTreasure], [siteLastUpdated],
		[adoption], [adopteeThreadPermission], [donations], [redeemedBells], [perks],
		[positiveScoutRatings], [neutralScoutRatings], [negativeScoutRatings]
	] = await Promise.all([
		this.query('v1/users/avatar', {id: accountData.id}),
		db.query(`
			SELECT
				user_group.id,
				user_group.identifier,
				user_group.name
			FROM users
			LEFT JOIN user_group ON users.user_group_id = user_group.id
			WHERE users.id = $1::int
		`, accountData.id),
		db.query(`
			SELECT
				signature,
				signature_format,
				last_active_time,
				tos_date,
				away_start_date,
				away_end_date,
				ban_length.description,
				user_title
			FROM users
			LEFT JOIN ban_length ON (ban_length.id = users.current_ban_length_id)
			WHERE users.id = $1::int
		`, accountData.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL
		`, accountData.id, ratingConfig.positive.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL
		`, accountData.id, ratingConfig.neutral.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NULL AND adoption_node_id IS NULL
		`, accountData.id, ratingConfig.negative.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, accountData.id, ratingConfig.positive.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, accountData.id, ratingConfig.neutral.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND listing_id IS NOT NULL
		`, accountData.id, ratingConfig.negative.id),
		db.query(`
			SELECT
				coalesce(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int and redeemed_user_id = $1::int
		`, accountData.id),
		db.query(`
			SELECT
				coalesce(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2) AND offer > (SELECT updated FROM site_setting WHERE id = 4)
		`, accountData.id, constants.bellThreshold),
		db.query(`
			SELECT
				updated
			FROM site_setting
			WHERE name IN ('Rules', 'Policies', 'TOS')
			ORDER BY updated DESC
			LIMIT 1
		`),
		db.query(`
			SELECT
				adoption.node_id,
				user_account_cache.username AS scout_username
			FROM adoption
			JOIN user_account_cache ON (user_account_cache.id = adoption.scout_id)
			WHERE adoptee_id = $1::int
		`, accountData.id),
		db.query(`
			SELECT granted
			FROM user_node_permission
			LEFT JOIN node_permission ON user_node_permission.node_permission_id = node_permission.id
			WHERE user_id = $1::int
			AND node_id = $2::int
			AND node_permission.identifier = $3::text
		`, accountData.id, adopteeThreadId, 'read'),
		db.query(`
			SELECT coalesce(sum(donation), 0) AS donations
			FROM user_donation
			WHERE user_id = $1::int
		`, accountData.id),
		db.query(`
			SELECT
				coalesce(sum(price), 0) AS bells
			FROM user_bell_shop_redeemed
			WHERE user_id = $1::int and currency = 'Bells'
		`, accountData.id),
		db.query(`
			SELECT coalesce(sum(donation), 0) AS donations
			FROM user_donation
			WHERE user_id = $1::int AND donated >= now() - interval '1' year
		`, accountData.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, accountData.id, ratingConfig.positive.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, accountData.id, ratingConfig.neutral.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			WHERE rating_user_id = $1::int AND rating = $2 AND adoption_node_id IS NOT NULL
		`, accountData.id, ratingConfig.negative.id),
	]);

	const totalBells = Number(treasure.bells) - Number(redeemedBells.bells);

	let reviewTOS = false;

	if (profileInfo.tos_date === null || dateUtils.isBefore(profileInfo.tos_date, siteLastUpdated.updated))
	{
		reviewTOS = true;
	}

	return {
		id: accountData.id,
		username: accountData.username,
		signupDate: accountData.signup_date,
		lastActiveTime: profileInfo.last_active_time,
		signature: profileInfo.signature,
		signatureFormat: profileInfo.signature_format,
		userTitle: profileInfo.user_title,
		avatar,
		group,
		bells: totalBells.toLocaleString(),
		missedBells: currentUser ? Number(missedTreasure.bells).toLocaleString() : 0,
		nonFormattedTotalBells: totalBells,
		adoptionThreadId: currentUser ? adoption?.node_id : null,
		scoutUsername: currentUser ? adoption?.scout_username : null,
		adopteeBuddyThreadId: currentUser ? (adopteeThreadPermission?.granted ? adopteeThreadId : null) : null,
		awayStartDate: viewProfiles || reassignAdopteesPerm ? profileInfo.away_start_date : null,
		awayEndDate: viewProfiles || reassignAdopteesPerm ? profileInfo.away_end_date : null,
		donations: viewProfiles ? Number(donations.donations) : 0,
		perks: viewProfiles ? Number(perks.donations) : 0,
		banLength: currentUser ? profileInfo.description : null,
		reviewTOS: currentUser ? reviewTOS : false,
		positiveWifiRatingsTotal: useFriendCodesPerm ? positiveWifiRatings.count : 0,
		neutralWifiRatingsTotal: useFriendCodesPerm ? neutralWifiRatings.count : 0,
		negativeWifiRatingsTotal: useFriendCodesPerm ? negativeWifiRatings.count : 0,
		positiveTradeRatingsTotal: useTradingPostPerm ? positiveTradeRatings.count : 0,
		neutralTradeRatingsTotal: useTradingPostPerm ? neutralTradeRatings.count : 0,
		negativeTradeRatingsTotal: useTradingPostPerm ? negativeTradeRatings.count : 0,
		positiveScoutRatingsTotal: scoutPagesPerm ? positiveScoutRatings.count : 0,
		neutralScoutRatingsTotal: scoutPagesPerm ? neutralScoutRatings.count : 0,
		negativeScoutRatingsTotal: scoutPagesPerm ? negativeScoutRatings.count : 0,
	};
}

user.apiTypes = {
	id: {
		type: APITypes.number,
	},
}

export default user;