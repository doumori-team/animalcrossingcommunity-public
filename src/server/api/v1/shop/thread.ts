import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, ThreadOrderType, ThreadApplicationType, ThreadType, ACGameItemType } from '@types';

async function thread(this: APIThisType, {id, category, getItems = false}: threadProps) : Promise<ThreadOrderType | ThreadApplicationType | ThreadType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'view-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	if (category === constants.shops.categories.orders)
	{
		const [[thread], items, claim] = await Promise.all([
			db.query(`
				SELECT
					shop_order.id,
					shop_order.node_id,
					shop_order.customer_id,
					customer.username AS customer_username,
					shop_order.employee_id,
					employee.username As employee_username,
					shop_order.ordered,
					COALESCE(shop_default_service.name, shop_service.name) AS service,
					shop_order.completed,
					shop.id AS shop_id,
					shop.name AS shop_name,
					user_node_permission.granted,
					shop_order.comment,
					ac_game.id AS game_id,
					ac_game.shortname AS shortname
				FROM shop_order
				JOIN user_account_cache AS customer ON (customer.id = shop_order.customer_id)
				LEFT JOIN user_account_cache AS employee ON (employee.id = shop_order.employee_id)
				LEFT JOIN shop_default_service ON (shop_default_service.id = shop_order.shop_default_service_id)
				LEFT JOIN shop_service ON (shop_service.id = shop_order.shop_service_id)
				LEFT JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.shop_default_service_id = shop_default_service.id)
				LEFT JOIN shop_service_ac_game ON (shop_service_ac_game.shop_service_id = shop_service.id)
				JOIN ac_game ON (ac_game.id = shop_order.game_id)
				JOIN shop ON (shop.id = shop_order.shop_id)
				LEFT JOIN user_node_permission ON (user_node_permission.node_id = shop_order.node_id AND user_node_permission.user_id = $2 AND user_node_permission.node_permission_id = $3 AND user_node_permission.granted = true)
				WHERE shop_order.id = $1
			`, id, this.userId, constants.nodePermissions.read),
			db.query(`
				SELECT catalog_item_id, quantity
				FROM shop_order_catalog_item
				WHERE shop_order_id = $1
			`, id),
			db.query(`
				SELECT shop_order.id
				FROM shop_order
				LEFT JOIN shop_default_service ON (shop_default_service.id = shop_order.shop_default_service_id)
				LEFT JOIN shop_service ON (shop_service.id = shop_order.shop_service_id)
				LEFT JOIN shop_role_service ON (shop_role_service.shop_service_id = shop_service.id)
				LEFT JOIN shop_role_default_service ON (shop_role_default_service.shop_default_service_id = shop_default_service.id)
				JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role_service.shop_role_id OR shop_user_role.shop_role_id = shop_role_default_service.shop_role_id)
				JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
				JOIN users ON (users.id = shop_user.user_id)
				WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_order.id = $2 AND (users.away_start_date IS NULL OR current_date NOT BETWEEN users.away_start_date AND away_end_date)
			`, this.userId, id),
		]);

		const [employeeShops] = await db.query(`
			SELECT shop_user.id
			FROM shop_user
			WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_user.shop_id = $2
		`, this.userId, thread.shop_id);

		if (!employeeShops && thread.customer_id != this.userId)
		{
			throw new UserError('permission');
		}

		const catalogItems:ACGameItemType[number]['all']['items'] = getItems && items.length > 0 ? (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${thread.game_id}_all_items`)).filter((ci:any) => items.some((i:any) => ci.id === i.catalog_item_id)) : [];

		this.query('v1/notification/destroy', {id: thread.id, type: constants.notification.types.shopOrder});

		return <ThreadOrderType>{
			id: thread.id,
			nodeId: thread.granted ? thread.node_id : null,
			employee: thread.employee_id ? {
				id: thread.employee_id,
				username: thread.employee_username,
			} : null,
			customer: {
				id: thread.customer_id,
				username: thread.customer_username,
			},
			shop: {
				id: thread.shop_id,
				name: thread.shop_name,
			},
			formattedDate: dateUtils.formatDateTime(thread.ordered),
			service: thread.service,
			status: thread.completed ? 'Completed' : (thread.employee_id ? 'In Progress' : 'Unclaimed'),
			comment: thread.comment,
			items: getItems && items.length > 0 ? items.map((item:any) => {
				return {
					id: item.catalog_item_id,
					quantity: item.quantity,
					name: catalogItems.find((ci:any) => ci.id === item.catalog_item_id)?.name,
				};
			}) : [],
			claim: !thread.employee_id && claim.length > 0,
			game: {
				id: thread.game_id,
				shortname: thread.shortname,
			},
		};
	}
	else if (category === constants.shops.categories.applications)
	{
		const [[thread], owners, contacts, shopGames, activeLast30Days] = await Promise.all([
			db.query(`
				SELECT
					shop_application.id,
					shop_application.node_id,
					shop_application.user_id,
					user_account_cache.username,
					shop.id AS shop_id,
					shop.name As shop_name,
					shop_application.applied,
					shop_role.name As role,
					shop_application.waitlisted,
					user_node_permission.granted,
					shop_application.application,
					shop_application.application_format
				FROM shop_application
				JOIN user_account_cache ON (shop_application.user_id = user_account_cache.id)
				JOIN shop ON (shop.id = shop_application.shop_id)
				JOIN shop_role ON (shop_role.id = shop_application.shop_role_id)
				LEFT JOIN user_node_permission ON (user_node_permission.node_id = shop_application.node_id AND user_node_permission.user_id = $2 AND user_node_permission.node_permission_id = $3 AND user_node_permission.granted = true)
				WHERE shop_application.id = $1
			`, id, this.userId, constants.nodePermissions.read),
			db.query(`
				SELECT shop_application.id
				FROM shop_application
				JOIN shop_user ON (shop_user.shop_id = shop_application.shop_id)
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_role.parent_id IS NULL AND shop_application.id = $2
			`, this.userId, id),
			db.query(`
				SELECT shop_application.id
				FROM shop_application
				JOIN shop_user ON (shop_user.shop_id = shop_application.shop_id)
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				JOIN shop_role shop_application_role ON (shop_application_role.id = shop_application.shop_role_id)
				JOIN (
					WITH RECURSIVE Descendants AS
					(
						SELECT shop_role.parent_id, shop_role.id
						FROM shop_role
						WHERE shop_role.parent_id IS NULL
						UNION ALL
						SELECT shop_role.parent_id, shop_role.id
						FROM shop_role
						JOIN Descendants D ON (D.id = shop_role.parent_id)
					)
					SELECT * from Descendants
				) AS parent_shop_roles ON (parent_shop_roles.parent_id = shop_role.id AND parent_shop_roles.id = shop_application_role.id)
				WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_application.id = $2
			`, this.userId, id),
			db.query(`
				SELECT
					ac_game.id AS game_id,
					ac_game.shortname
				FROM shop_application_ac_game
				JOIN ac_game ON (ac_game.id = shop_application_ac_game.game_id)
				WHERE shop_application_ac_game.shop_application_id = $1
			`, id),
			db.query(`
				SELECT COUNT(*) AS count, start_date::date
				FROM shop_application
				JOIN user_session ON (user_session.user_id = shop_application.user_id)
				WHERE shop_application.id = $1 AND user_session.start_date > now() - interval '30' day
				GROUP BY start_date::date
			`, id),
		]);

		const [[employeeApplications], threadUser, threadUserRatings] = await Promise.all([
			db.query(`
				SELECT shop_user.id
				FROM shop_user
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_user.shop_id = $2 AND shop_role.applications = true
			`, this.userId, thread.shop_id),
			this.query('v1/user', {id: thread.user_id}),
			this.query('v1/users/ratings', {id: thread.user_id}),
			this.query('v1/notification/destroy', {id: thread.id, type: constants.notification.types.shopApplication}),
		]);

		if (!employeeApplications && thread.user_id != this.userId)
		{
			throw new UserError('permission');
		}

		return <ThreadApplicationType>{
			id: thread.id,
			nodeId: thread.granted ? thread.node_id : null,
			shop: {
				id: thread.shop_id,
				name: thread.shop_name,
			},
			formattedDate: dateUtils.formatDateTime(thread.applied),
			user: {
				id: thread.user_id,
				username: thread.username,
				lastActiveTime: threadUser.lastActiveTime,
				positiveWifiRatingsTotal: threadUserRatings.positiveWifiRatingsTotal,
				neutralWifiRatingsTotal: threadUserRatings.neutralWifiRatingsTotal,
				negativeWifiRatingsTotal: threadUserRatings.negativeWifiRatingsTotal,
				positiveTradeRatingsTotal: threadUserRatings.positiveTradeRatingsTotal,
				neutralTradeRatingsTotal: threadUserRatings.neutralTradeRatingsTotal,
				negativeTradeRatingsTotal: threadUserRatings.negativeTradeRatingsTotal,
				positiveShopRatingsTotal: threadUserRatings.positiveShopRatingsTotal,
				neutralShopRatingsTotal: threadUserRatings.neutralShopRatingsTotal,
				negativeShopRatingsTotal: threadUserRatings.negativeShopRatingsTotal,
				active30Days: activeLast30Days.length,
			},
			role: thread.role,
			waitlisted: thread.waitlisted,
			contact: !thread.node_id && (owners.length > 0 || contacts.length > 0),
			games: shopGames.map((sg:any) => {
				return {
					id: sg.game_id,
					shortname: sg.shortname,
				};
			}),
			application: {
				content: thread.application,
				format: thread.application_format,
			},
			emojiSettings: await this.query('v1/settings/emoji', { userIds: [thread.user_id] }),
		};
	}

	const [[thread], [latestPage], [latestPost]] = await Promise.all([
		db.query(`
			SELECT
				node.id,
				(
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = node.id
					ORDER BY time DESC
					LIMIT 1
				) AS title,
				shop.id AS shop_id,
				shop.name AS shop_name,
				node.creation_time
			FROM node
			JOIN shop_node ON (shop_node.node_id = node.id)
			JOIN shop ON (shop_node.shop_id = shop.id)
			JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			WHERE node.id = $1 AND user_node_permission.user_id = $2 AND user_node_permission.node_permission_id = $3 AND user_node_permission.granted = true
		`, id, this.userId, constants.nodePermissions.read),
		db.getLatestPage(id, this.userId),
		db.getLatestPost(id, this.userId),
	]);

	return <ThreadType>{
		id: thread.id,
		title: thread.title,
		shop: {
			id: thread.shop_id,
			name: thread.shop_name,
		},
		formattedDate: dateUtils.formatDateTime(thread.creation_time),
		latestPage: latestPage ? latestPage.latest_page : null,
		latestPost: latestPost ? latestPost.latest_post : null,
	};
}

thread.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	category: {
		type: APITypes.string,
		default: constants.shops.categories.orders,
		includes: [constants.shops.categories.orders, constants.shops.categories.applications, constants.shops.categories.threads],
		required: true,
	},
}

type threadProps = {
	id: number
	category: string
	getItems: boolean
}

export default thread;