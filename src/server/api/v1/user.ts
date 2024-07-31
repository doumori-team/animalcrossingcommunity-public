import * as db from '@db';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import * as accounts from '@accounts';
import { APIThisType, UserType } from '@types';

/*
 * Extracts a user's information. Anything more then id / username.
 */
async function user(this: APIThisType, {id, username}: userProps) : Promise<UserType>
{
	if (id == null)
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
	let reassignAdopteesPerm = true, accForumsPerm = true, viewProfiles = true;

	if (!currentUser)
	{
		[reassignAdopteesPerm, accForumsPerm, viewProfiles] = await Promise.all([
			this.query('v1/permission', {permission: 'adoption-reassign'}),
			this.query('v1/node/permission', {permission: 'read', nodeId: constants.boardIds.accForums}),
			this.query('v1/permission', {permission: 'view-profiles'}),
		]);

		if (!(reassignAdopteesPerm || accForumsPerm || viewProfiles))
		{
			throw new UserError('permission');
		}
	}

	const [
		avatar, [group], [profileInfo], [treasure], [missedTreasure], [siteLastUpdated],
		[adoption], [adopteeThreadPermission], [redeemedBells]
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
				user_title,
				show_images
			FROM users
			WHERE users.id = $1::int
		`, accountData.id),
		db.query(`
			SELECT total_bells AS bells
			FROM top_bell
			WHERE user_id = $1::int
		`, accountData.id),
		currentUser ? db.query(`
			SELECT COALESCE(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2) AND offer > (SELECT updated FROM site_setting WHERE id = 4)
		`, accountData.id, constants.bellThreshold) : [null],
		currentUser ? db.cacheQuery(constants.cacheKeys.siteSetting, `
			SELECT updated
			FROM site_setting
			WHERE name IN ('Rules', 'Policies', 'TOS')
			ORDER BY updated DESC
			LIMIT 1
		`) : [null],
		currentUser ? db.query(`
			SELECT
				adoption.node_id,
				user_account_cache.username AS scout_username
			FROM adoption
			JOIN user_account_cache ON (user_account_cache.id = adoption.scout_id)
			WHERE adoptee_id = $1::int
		`, accountData.id) : [null],
		currentUser ? db.query(`
			SELECT granted
			FROM user_node_permission
			WHERE user_id = $1::int AND node_id = $2::int AND user_node_permission.node_permission_id = $3::int
		`, accountData.id, constants.boardIds.adopteeBT, constants.nodePermissions.read) : [null],
		db.query(`
			SELECT COALESCE(sum(price), 0) AS bells
			FROM user_bell_shop_redeemed
			WHERE (user_id = $1::int OR redeemed_by = $1::int) and currency = 'Bells'
		`, accountData.id),
	]);

	const allBells = treasure ? Number(treasure.bells) : 0;

	const totalBells = allBells - Number(redeemedBells.bells);

	let reviewTOS = false;

	if (currentUser && (profileInfo.tos_date === null || dateUtils.isBefore(profileInfo.tos_date, siteLastUpdated.updated)))
	{
		reviewTOS = true;
	}

	return <UserType>{
		id: accountData.id,
		username: accountData.username,
		signupDate: accountData.signup_date,
		lastActiveTime: profileInfo.last_active_time,
		signature: profileInfo.signature,
		signatureFormat: profileInfo.signature_format,
		userTitle: profileInfo.user_title,
		showImages: profileInfo.show_images,
		avatar,
		group,
		bells: totalBells.toLocaleString(),
		allBells: allBells.toLocaleString(),
		missedBells: currentUser ? Number(missedTreasure.bells).toLocaleString() : '0',
		nonFormattedTotalBells: totalBells,
		adoptionThreadId: currentUser ? adoption?.node_id : null,
		scoutUsername: currentUser ? adoption?.scout_username : null,
		adopteeBuddyThreadId: currentUser ? (adopteeThreadPermission?.granted ? constants.boardIds.adopteeBT : null) : null,
		awayStartDate: viewProfiles || reassignAdopteesPerm ? profileInfo.away_start_date : null,
		awayEndDate: viewProfiles || reassignAdopteesPerm ? profileInfo.away_end_date : null,
		reviewTOS: reviewTOS,
	};
}

user.apiTypes = {
	id: {
		type: APITypes.number,
	},
}

type userProps = {
	id?: number | string | null
	username?: string
}

export default user;