import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType } from '@types';

async function check(this: APIThisType, { badgeId }: checkProps): Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [badge] = await db.query(`
		SELECT id
		FROM badge
		WHERE id = $1
	`, badgeId);

	if (!badge)
	{
		throw new UserError('no-such-badge');
	}

	const [userBadge] = await db.query(`
		SELECT id
		FROM user_badge
		WHERE badge_id = $1 AND user_id = $2
	`, badgeId, this.userId);

	if (userBadge)
	{
		return;
	}

	if (badgeId === constants.badges.tenpatterns)
	{
		const [patternsCount] = await db.query(`
			SELECT count(*) AS count
			FROM pattern
			WHERE creator_id = $1
			GROUP BY creator_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!patternsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.totpd)
	{
		const [nodeCount] = await db.query(`
			SELECT count(*) AS count
			FROM node
			WHERE id = (
				SELECT parent_node_id
				FROM node
				WHERE user_id = $1
				ORDER BY creation_time DESC
				LIMIT 1
			)
		`, this.userId);

		if ((nodeCount.count - 1) / constants.threadPageSize !== 0)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.seasons)
	{
		const [winter, spring, summer, fall] = await Promise.all([
			db.query(`
				SELECT count(*) AS count
				FROM user_session
				WHERE user_id = $1 AND to_char(start_date,'MMDD') BETWEEN '1221' AND '0320'
			`, this.userId),
			db.query(`
				SELECT count(*) AS count
				FROM user_session
				WHERE user_id = $1 AND to_char(start_date,'MMDD') BETWEEN '0321' AND '0620'
			`, this.userId),
			db.query(`
				SELECT count(*) AS count
				FROM user_session
				WHERE user_id = $1 AND to_char(start_date,'MMDD') BETWEEN '0621' AND '0922'
			`, this.userId),
			db.query(`
				SELECT count(*) AS count
				FROM user_session
				WHERE user_id = $1 AND to_char(start_date,'MMDD') BETWEEN '0923' AND '1220'
			`, this.userId),
		]);

		if (!(winter.count > 0 && spring.count > 0 && summer.count > 0 && fall.count > 0))
		{
			return;
		}
	}
	else if (badgeId === constants.badges.admin)
	{
		const [adminGroup] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND user_group_id = $2
		`, this.userId, constants.userGroupIds.admin);

		if (!adminGroup)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.mod)
	{
		const [modGroup] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND user_group_id = $2
		`, this.userId, constants.userGroupIds.mod);

		if (!modGroup)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.dev)
	{
		const [devGroup] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND user_group_id = $2
		`, this.userId, constants.userGroupIds.dev);

		if (!devGroup)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.researcher)
	{
		const [researcherGroup] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND user_group_id = $2
		`, this.userId, constants.userGroupIds.researcher);

		if (!researcherGroup)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.scout)
	{
		const [scoutGroup] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND user_group_id = $2
		`, this.userId, constants.userGroupIds.scout);

		if (!scoutGroup)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.oneyear)
	{
		const [oneYearCheck] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE id = $1 AND signup_date < current_date - interval '1' year
		`, this.userId);

		if (!oneYearCheck)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.fiveyears)
	{
		const [fiveYearCheck] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE id = $1 AND signup_date < current_date - interval '5' year
		`, this.userId);

		if (!fiveYearCheck)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenyears)
	{
		const [tenYearCheck] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE id = $1 AND signup_date < current_date - interval '10' year
		`, this.userId);

		if (!tenYearCheck)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.twentyyears)
	{
		const [twentyYearCheck] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE id = $1 AND signup_date < current_date - interval '20' year
		`, this.userId);

		if (!twentyYearCheck)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.fiftykbellsday)
	{
		const [fiftykbellsCheck] = await db.query(`
			SELECT user_id
			FROM treasure_offer
			WHERE user_id = $1
			GROUP BY user_id, date(offer)
			HAVING sum(bells) >= 50000
		`, this.userId);

		if (!fiftykbellsCheck)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.onedonater)
	{
		const [fiveDonater] = await db.query(`
			SELECT user_id
			FROM user_donation
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 5 AND SUM(donation) > (5*5)
		`, this.userId);

		if (!fiveDonater)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.twodonater)
	{
		const [tenDonater] = await db.query(`
			SELECT user_id
			FROM user_donation
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 10 AND SUM(donation) > (5*10)
		`, this.userId);

		if (!tenDonater)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.threedonater)
	{
		const [twentyDonater] = await db.query(`
			SELECT user_id
			FROM user_donation
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 20 AND SUM(donation) > (5*20)
		`, this.userId);

		if (!twentyDonater)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tentunes)
	{
		const [tunesCount] = await db.query(`
			SELECT count(*) AS count
			FROM town_tune
			WHERE creator_id = $1
			GROUP BY creator_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!tunesCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.townallgames)
	{
		const [townsCount] = await db.query(`
			SELECT count(*) AS count
			FROM town
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(DISTINCT game_id) >= 5
		`, this.userId);

		if (!townsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tentrades)
	{
		const [listingsCount] = await db.query(`
			SELECT count(*) AS count
			FROM listing_offer
			JOIN listing ON (listing.id = listing_offer.listing_id)
			WHERE listing_offer.user_id = $1 AND listing.status IN ('Closed', 'Completed') AND listing_offer.status = 'Accepted'
			GROUP BY listing_offer.user_id
			HAVING count(*) >= 19
		`, this.userId);

		if (!listingsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.top5bells)
	{
		const [top5Bell] = await db.query(`
			SELECT
				top_bell.id,
				top_bell.username,
				top_bell.rank
			FROM top_bell_search AS top_bell
			WHERE top_bell.id = $1 AND top_bell.rank <= 5
			ORDER BY rank ASC
		`, this.userId);

		if (!top5Bell)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenbellshop)
	{
		const [bellShopCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_bell_shop_redeemed
			WHERE user_id = $1 AND (redeemed_by IS NULL OR redeemed_by = user_Id)
			GROUP BY user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!bellShopCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenorderedshop)
	{
		const [shopOrderCount] = await db.query(`
			SELECT count(*) AS count
			FROM shop_order
			WHERE customer_id = $1
			GROUP BY customer_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!shopOrderCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenbuddies)
	{
		const [buddiesCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_buddy
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!buddiesCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.gcitems)
	{
		const [gcItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND town.game_id = $2
			GROUP BY town.user_id, town.id, character.id
			HAVING count(*) >= 1441
		`, this.userId, constants.gameIds.ACGC);

		if (!gcItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.wwitems)
	{
		const [wwItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND town.game_id = $2
			GROUP BY town.user_id, town.id, character.id
			HAVING count(*) >= 1772
		`, this.userId, constants.gameIds.ACWW);

		if (!wwItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.cfitems)
	{
		const [cfItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND town.game_id = $2
			GROUP BY town.user_id, town.id, character.id
			HAVING count(*) >= 2139
		`, this.userId, constants.gameIds.ACCF);

		if (!cfItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.nlitems)
	{
		const [nlItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND town.game_id = $2
			GROUP BY town.user_id, town.id, character.id
			HAVING count(*) >= 4468
		`, this.userId, constants.gameIds.ACNL);

		if (!nlItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.nhitems)
	{
		const [nhItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND town.game_id = $2
			GROUP BY town.user_id, town.id, character.id
			HAVING count(*) >= 25645
		`, this.userId, constants.gameIds.ACNH);

		if (!nhItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.pcitems)
	{
		const [pcItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM pc_catalog_item
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 10588
		`, this.userId);

		if (!pcItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.rwitems)
	{
		const [rwItemsCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_ac_item
			WHERE user_id = $1
			GROUP BY user_id
			HAVING count(*) >= 837
		`, this.userId);

		if (!rwItemsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tengiftsbellshop)
	{
		const [bellShopGiftCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_bell_shop_redeemed
			WHERE user_id = $1 AND (redeemed_by IS NOT NULL AND redeemed_by != user_Id)
			GROUP BY user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!bellShopGiftCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tendeliveredshop)
	{
		const [shopDeliveredCount] = await db.query(`
			SELECT count(*) AS count
			FROM shop_order
			WHERE employee_id = $1
			GROUP BY employee_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!shopDeliveredCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.adopted)
	{
		const [adopted] = await db.query(`
			SELECT id
			FROM adoption
			WHERE adoptee_id = $1
		`, this.userId);

		if (!adopted)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.pushnotifications)
	{
		const [pushNotification] = await db.query(`
			SELECT id
			FROM user_subscription
			WHERE user_id = $1
			LIMIT 1
		`, this.userId);

		if (!pushNotification)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.threadstickied)
	{
		const [threadStickied] = await db.query(`
			SELECT node.id
			FROM node
			JOIN node AS parent ON (parent.id = node.parent_node_id)
			WHERE node.user_id = $1 AND node.type = 'thread' AND parent.type = 'board' and parent.board_type = 'public' AND node.thread_type = 'sticky'
			LIMIT 1
		`, this.userId);

		if (!threadStickied)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.reportbug)
	{
		const [reportBug] = await db.query(`
			SELECT id
			FROM feature
			WHERE created_user_id = $1 AND is_bug = true
			LIMIT 1
		`, this.userId);

		if (!reportBug)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.suggestion)
	{
		const [suggestion] = await db.query(`
			SELECT id
			FROM feature
			WHERE created_user_id = $1 AND is_bug = false
			LIMIT 1
		`, this.userId);

		if (!suggestion)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenmuseum)
	{
		const [museumCount] = await db.query(`
			SELECT count(*) AS count
			FROM catalog_item
			JOIN character ON (character.id = catalog_item.character_id)
			JOIN town ON (town.id = character.town_id)
			WHERE town.user_id = $1 AND catalog_item.in_museum = true
			GROUP BY town.user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!museumCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tencreatorthreads)
	{
		const [creatorThreadCount] = await db.query(`
			SELECT count(*) AS count
			FROM node
			JOIN node AS parent ON (parent.id = node.parent_node_id)
			WHERE node.user_id = $1 AND node.type = 'thread' AND parent.board_type = 'public'
			GROUP BY node.user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!creatorThreadCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenratings)
	{
		const [ratingsCount] = await db.query(`
			SELECT count(*) AS count
			FROM rating
			WHERE user_id = $1 AND rating = 'positive'
			GROUP BY user_id
			HAVING count(*) >= 10
		`, this.userId);

		if (!ratingsCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.tenwelcomes)
	{
		const [welcomeCount] = await db.query(`
			SELECT count(*) AS count
			FROM node
			JOIN node AS parent ON (parent.id = node.parent_node_id)
			WHERE node.user_id = $1 AND parent.parent_node_id = $2 AND parent.type = 'thread' AND node.type = 'post'
			GROUP BY node.user_id
			HAVING count(*) >= 10
		`, this.userId, constants.boardIds.gettingStarted);

		if (!welcomeCount)
		{
			return;
		}
	}
	else if (badgeId === constants.badges.southernhemisphere)
	{
		const [southernHemisphereCheck] = await db.query(`
			SELECT id
			FROM users
			WHERE id = $1 AND southern_hemisphere = true
		`, this.userId);

		if (!southernHemisphereCheck)
		{
			return;
		}
	}
	else
	{
		throw new UserError('bad-format');
	}

	await db.query(`
		INSERT INTO user_badge (badge_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, badge_id) DO NOTHING
	`, badgeId, this.userId);

	// remove when ready to notify
	//await this.query('v1/notification/create', { id: badgeId, type: constants.notification.types.badge });
}

check.permissions = [
	'userId',
];

check.apiTypes = {
	badgeId: {
		type: APITypes.number,
		default: 0,
		required: true,
	},
};

type checkProps = {
	badgeId: number
};

export default check;
