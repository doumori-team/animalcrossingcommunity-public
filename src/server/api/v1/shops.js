import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function shops({page, services, fee, vacation, gameId, mine})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	services = await Promise.all(services.map(async(serviceId) =>
	{
		const id = serviceId.substring('default_'.length);

		if (isNaN(id))
		{
			throw new UserError('no-such-service');
		}

		const [checkId] = await db.query(`
			SELECT id
			FROM shop_default_service
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-service');
		}

		return Number(id);
	}));

	// Do actual search
	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			shop.id,
			count(*) over() AS count
		FROM shop
	`;

	// Add joins
	if (services.length > 0)
	{
		query += `
			JOIN shop_default_service_shop ON (shop_default_service_shop.shop_id = shop.id)
		`;
	}

	if (gameId > 0)
	{
		query += `
			JOIN shop_ac_game ON (shop_ac_game.shop_id = shop.id)
		`;
	}

	if (mine)
	{
		query += `
			JOIN shop_user ON (shop_user.shop_id = shop.id AND shop_user.active = true)
			JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
			JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id AND shop_role.parent_id IS NULL)
		`;
	}

	// Add wheres
	let wheres = [];

	if (['yes', 'no'].includes(fee))
	{
		params[paramIndex] = fee === 'yes' ? false : true;

		paramIndex++;

		wheres.push(`shop.free = $` + paramIndex);
	}

	if (['yes', 'no'].includes(vacation))
	{
		if (vacation === 'yes')
		{
			params[paramIndex] = dateUtils.formatCurrentDateYearMonthDay();

			paramIndex++;

			wheres.push(`shop.vacation_start_date >= $` + paramIndex);
			wheres.push(`shop.vacation_end_date <= $` + paramIndex);
		}
		else
		{
			wheres.push(`shop.vacation_start_date IS NULL`);
		}
	}

	if (services.length > 0)
	{
		params[paramIndex] = services;

		paramIndex++;

		wheres.push(`shop_default_service_shop.shop_default_service_id = ANY($` + paramIndex + `)`);
	}

	if (gameId > 0)
	{
		params[paramIndex] = gameId;

		paramIndex++;

		wheres.push(`shop_ac_game.game_id = $` + paramIndex);
	}

	if (mine)
	{
		params[paramIndex] = this.userId;

		paramIndex++;

		wheres.push(`shop_user.user_id = $` + paramIndex);
	}
	else
	{
		wheres.push(`shop.active = true`);
	}

	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (key > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		GROUP BY shop.id
		ORDER BY random() DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const shops = await db.query(query, ...params);

	if (shops.length > 0)
	{
		results = await Promise.all(shops.map(async(shop) => {
			return this.query('v1/shop', {id: shop.id});
		}));

		count = Number(shops[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		services: services,
		fee: fee,
		vacation: vacation,
		gameId: gameId,
	};
}

shops.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	fee: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	vacation: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	gameId: {
		type: APITypes.acgameId,
		default: -1,
		nullable: true,
	},
	services: {
		type: APITypes.array,
	},
	mine: {
		type: APITypes.boolean,
		default: 'false',
	},
}

export default shops;