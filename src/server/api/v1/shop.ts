import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ShopType } from '@types';

async function shop(this: APIThisType, { id }: shopProps): Promise<ShopType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [shop] = await db.query(`
		SELECT
			shop.id,
			shop.name,
			shop.short_description,
			shop.description,
			shop.description_format,
			shop.created,
			shop.free,
			shop.vacation_start_date,
			shop.vacation_end_date,
			shop.allow_transfer,
			shop.active,
			file.file_id
		FROM shop
		LEFT JOIN file ON (file.id = shop.header_file_id)
		WHERE shop.id = $1::int
	`, id);

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	const [owners, games, items, pendingOrders, transfer, ownersActive,
		[positiveRatings], [neutralRatings], [negativeRatings], shopServicesData,
		shopDefaultServicesData, statsUsers,
	] = await Promise.all([
		db.query(`
			SELECT user_account_cache.id, user_account_cache.username
			FROM shop_role
			JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role.id)
			JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
			JOIN user_account_cache ON (user_account_cache.id = shop_user.user_id)
			WHERE shop_role.shop_id = $1 AND shop_role.parent_id IS NULL AND shop_user.active = true
		`, shop.id),
		db.query(`
			SELECT
				ac_game.id,
				ac_game.name,
				ac_game.shortname,
				shop_ac_game.per_order,
				shop_ac_game.stack_or_quantity,
				shop_ac_game.complete_order
			FROM ac_game
			JOIN shop_ac_game ON (shop_ac_game.game_id = ac_game.id)
			WHERE shop_ac_game.shop_id = $1
		`, shop.id),
		db.query(`
			SELECT shop_catalog_item.catalog_item_id, shop_catalog_item.game_id
			FROM shop_catalog_item
			WHERE shop_catalog_item.shop_id = $1
		`, shop.id),
		db.query(`
			SELECT shop_order.id
			FROM shop_order
			LEFT JOIN shop_default_service ON (shop_default_service.id = shop_order.shop_default_service_id)
			LEFT JOIN shop_service ON (shop_service.id = shop_order.shop_service_id)
			LEFT JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.shop_default_service_id = shop_default_service.id)
			LEFT JOIN shop_service_ac_game ON (shop_service_ac_game.shop_service_id = shop_service.id)
			LEFT JOIN shop_ac_game AS default_service_game ON (default_service_game.game_id = shop_default_service_ac_game.game_id AND shop_order.shop_id = default_service_game.shop_id)
			LEFT JOIN shop_ac_game AS service_game ON (service_game.game_id = service_game.game_id AND shop_order.shop_id = service_game.shop_id)
			WHERE shop_order.customer_id = $2 AND shop_order.shop_id = $1 AND shop_order.completed IS NULL AND (default_service_game.complete_order = true OR service_game.complete_order = true)
		`, shop.id, this.userId),
		db.query(`
			SELECT shop_user.id
			FROM shop_user
			JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
			JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
			WHERE shop_user.shop_id = $1 AND shop_user.user_id = $2 AND shop_user.active = true AND shop_role.parent_id IN (SELECT id FROM shop_role WHERE shop_id = $1 AND parent_id IS NULL)
		`, shop.id, this.userId),
		db.query(`
			SELECT shop_user.shop_id
			FROM shop_user
			JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
			JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
			JOIN users ON (shop_user.user_id = users.id)
			WHERE shop_role.parent_id IS NULL AND shop_role.shop_id = $1 AND users.last_active_time > now() - interval '15 days'
		`, shop.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			JOIN shop_node ON (rating.shop_node_id = shop_node.node_Id)
			WHERE shop_node.shop_id = $1::int AND rating = $2
		`, shop.id, constants.rating.configs.positive.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			JOIN shop_node ON (rating.shop_node_id = shop_node.node_Id)
			WHERE shop_node.shop_id = $1::int AND rating = $2
		`, shop.id, constants.rating.configs.neutral.id),
		db.query(`
			SELECT
				count(*) AS count
			FROM rating
			JOIN shop_node ON (rating.shop_node_id = shop_node.node_Id)
			WHERE shop_node.shop_id = $1::int AND rating = $2
		`, shop.id, constants.rating.configs.negative.id),
		db.query(`
			SELECT COUNT(*) AS count, shop_service.name, ac_game.shortname
			FROM shop
			JOIN shop_order ON (shop_order.shop_id = shop.id)
			JOIN shop_service ON (shop_service.shop_id = shop.id AND shop_order.shop_service_id = shop_service.id)
			JOIN ac_game ON (ac_game.id = shop_order.game_id)
			WHERE shop.id = $1 AND shop_service.active = true AND shop_order.completed > now() - interval '30' day
			GROUP BY shop_service.name, ac_game.shortname
			ORDER BY shop_service.name ASC
		`, shop.id),
		db.query(`
			SELECT COUNT(*) AS count, shop_default_service.name, ac_game.shortname
			FROM shop
			JOIN shop_order ON (shop_order.shop_id = shop.id)
			JOIN shop_default_service_shop ON (shop_default_service_shop.shop_id = shop.id)
			JOIN shop_default_service ON (shop_order.shop_default_service_id = shop_default_service.id AND shop_default_service.id = shop_default_service_shop.shop_default_service_id)
			JOIN ac_game ON (ac_game.id = shop_order.game_id)
			WHERE shop.id = $1 AND shop_default_service_shop.active = true AND shop_order.completed > now() - interval '30' day
			GROUP BY shop_default_service.name, ac_game.shortname
			ORDER BY shop_default_service.name ASC
		`, shop.id),
		db.query(`
			SELECT user_account_cache.id, user_account_cache.username
			FROM shop_role
			JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role.id)
			JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
			JOIN user_account_cache ON (user_account_cache.id = shop_user.user_id)
			WHERE shop_role.shop_id = $1 AND shop_user.active = true AND shop_role.stats = true
		`, shop.id),
		this.query('v1/notification/destroy', { id: shop.id, type: constants.notification.types.shopEmployee }),
	]);

	let statData: any = [], extraStatData: any = null;

	if (shopServicesData.length > 0 || shopDefaultServicesData.length > 0)
	{
		shopDefaultServicesData.concat(shopServicesData).map((s: any) =>
		{
			const stat = statData.find((x: any) => x.name === s.name);

			if (stat)
			{
				stat[s.shortname] = Number(s.count);
			}
			else
			{
				statData.push({
					name: s.name,
					[s.shortname]: Number(s.count),
				});
			}
		});
	}

	if (statsUsers.find((u: any) => u.id === this.userId))
	{
		extraStatData = {
			stats: [],
			employees: [],
		};

		const [shopServicesUsers, shopDefaultServicesUsers, employees] = await Promise.all([
			db.query(`
				SELECT COUNT(*) AS count, shop_service.name, user_account_cache.username
				FROM shop
				JOIN shop_service ON (shop_service.shop_id = shop.id)
				JOIN shop_order ON (shop_order.shop_id = shop.id AND shop_order.shop_service_id = shop_service.id)
				JOIN user_account_cache ON (user_account_cache.id = shop_order.employee_id)
				WHERE shop.id = $1 AND shop_service.active = true AND shop_order.completed > now() - interval '30' day
				GROUP BY shop_service.name, user_account_cache.username
				ORDER BY user_account_cache.username ASC
			`, shop.id),
			db.query(`
				SELECT COUNT(*) AS count, shop_default_service.name, user_account_cache.username
				FROM shop
				JOIN shop_default_service_shop ON (shop_default_service_shop.shop_id = shop.id)
				JOIN shop_default_service ON (shop_default_service.id = shop_default_service_shop.shop_default_service_id)
				JOIN shop_order ON (shop_order.shop_id = shop.id AND shop_order.shop_default_service_id = shop_default_service.id)
				JOIN user_account_cache ON (user_account_cache.id = shop_order.employee_id)
				WHERE shop.id = $1 AND shop_default_service_shop.active = true AND shop_order.completed > now() - interval '30' day
				GROUP BY shop_default_service.name, user_account_cache.username
				ORDER BY user_account_cache.username ASC
			`, shop.id),
			db.query(`
				SELECT shop_user.user_id AS id, user_account_cache.username, users.last_active_time
				FROM shop_user
				JOIN user_account_cache ON (user_account_cache.id = shop_user.user_id)
				JOIN users ON (users.id = user_account_cache.id)
				WHERE shop_user.shop_id = $1 AND shop_user.active = true
				ORDER BY user_account_cache.username ASC
			`, id),
		]);

		shopDefaultServicesUsers.concat(shopServicesUsers).map((s: any) =>
		{
			const stat = extraStatData.stats.find((x: any) => x.username === s.username);

			if (stat)
			{
				stat[s.name] = Number(s.count);
			}
			else
			{
				extraStatData.stats.push({
					username: s.username,
					[s.name]: Number(s.count),
				});
			}
		});

		extraStatData.employees = employees.map((u: any) =>
		{
			return {
				id: u.id,
				username: u.username,
				lastActiveTime: u.last_active_time,
			};
		});
	}

	return <ShopType>{
		id: shop.id,
		name: shop.name,
		shortDescription: shop.short_description,
		description: {
			content: shop.description,
			format: shop.description_format,
		},
		formattedDate: dateUtils.formatDateTimezone(shop.created),
		free: shop.free,
		vacation: shop.vacation_start_date ? {
			formattedStartDate: dateUtils.formatDate(shop.vacation_start_date),
			formattedEndDate: dateUtils.formatDate(shop.vacation_end_date),
			current: (dateUtils.currentDateIsAfter(shop.vacation_start_date) || dateUtils.currentDateIsSame(shop.vacation_start_date)) && (dateUtils.currentDateIsBefore(shop.vacation_end_date) || dateUtils.currentDateIsSame(shop.vacation_end_date)),
			startDate: dateUtils.formatYearMonthDay(shop.vacation_start_date),
			endDate: dateUtils.formatYearMonthDay(shop.vacation_end_date),
		} : null,
		allowTransfer: shop.allow_transfer,
		active: shop.active,
		header: shop.file_id ? `${constants.SHOP_FILE_DIR}${shop.id}/${shop.file_id}` : null,
		fileId: shop.file_id,
		owners: owners,
		games: games.length > 0 ?
			games.map((game: any) =>
			{
				let color = '';

				switch(game.id)
				{
					case constants.gameIds.ACGC:
						color = '#c94024'; // red
						break;
					case constants.gameIds.ACWW:
						color = '#29b524'; // green
						break;
					case constants.gameIds.ACCF:
						color = '#bdb51a'; // yellow
						break;
					case constants.gameIds.ACNL:
						color = '#c425bf'; // pink
						break;
					case constants.gameIds.ACNH:
						color = '#1d69ab'; // blue
						break;
				}

				return {
					id: game.id,
					name: game.name,
					shortname: game.shortname,
					perOrder: game.per_order,
					stackOrQuantity: game.stack_or_quantity,
					completeOrder: game.complete_order,
					items: items.filter((i: any) => i.game_id === game.id).map((i: any) => i.catalog_item_id),
					color: color,
				};
			})
			: [],
		pendingOrder: pendingOrders.length > 0,
		transfer: shop.allow_transfer && transfer.length > 0 && ownersActive.length === 0,
		positiveRatingsTotal: positiveRatings.count,
		neutralRatingsTotal: neutralRatings.count,
		negativeRatingsTotal: negativeRatings.count,
		statData: statData,
		statsUsers: statsUsers,
		extraStatData: extraStatData,
	};
}

shop.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type shopProps = {
	id: number
};

export default shop;
