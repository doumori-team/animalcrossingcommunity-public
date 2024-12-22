import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ThreadsType, ShopType } from '@types';

async function threads(this: APIThisType, { page, shopId, category, type, status, waitlisted, locked }: threadsType): Promise<ThreadsType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Get list of shops; all the current user has been a customer at AND is currently an employee at
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', { id: this.userId });

	const [shops, markupStyle] = await Promise.all([
		db.query(`
			SELECT
				shop.id,
				shop.name,
				EXISTS (
					SELECT shop_user.user_id
					FROM shop_user
					WHERE shop_user.shop_id = shop.id AND shop_user.user_id = $1::int AND shop_user.active = true
				) AS employee
			FROM shop
			WHERE EXISTS (
				SELECT shop_user.id
				FROM shop_user
				WHERE shop_user.shop_id = shop.id AND shop_user.user_id = $1::int AND shop_user.active = true
				LIMIT 1
			) OR EXISTS (
				SELECT shop_order.id
				FROM shop_order
				WHERE shop_order.shop_id = shop.id AND shop_order.customer_id = $1::int
				LIMIT 1
			) OR EXISTS (
				SELECT shop_application.id
				FROM shop_application
				WHERE shop_application.shop_id = shop.id AND shop_application.user_id = $1::int
				LIMIT 1
			) OR EXISTS (
				SELECT shop_node.node_id
				FROM shop_node
				JOIN user_node_permission ON (user_node_permission.node_id = shop_node.node_id AND user_node_permission.user_id = $1::int AND user_node_permission.granted = true)
				WHERE shop_node.shop_id = shop.id
				LIMIT 1
			)
			ORDER BY shop.name ASC
		`, this.userId),
		db.query(`
			SELECT markup_style
			FROM users
			WHERE id = $1
		`, this.userId),
	]);

	// Check parameters
	if (!shopId || category !== constants.shops.categories.orders)
	{
		type = 'both';
		status = 'all';
	}

	if (!shopId || category !== constants.shops.categories.applications)
	{
		waitlisted = 'both';
	}

	if (!shopId || category !== constants.shops.categories.threads)
	{
		locked = false;
	}

	if (shopId > 0)
	{
		const shop: ShopType = await this.query('v1/shop', { id: shopId });

		if (!shop)
		{
			throw new UserError('no-such-shop');
		}

		if (!shops.find((s: any) => s.id === shopId))
		{
			throw new UserError('permission');
		}
	}

	const pageSize = 24;
	let results = [], count = 0;

	if (shops.length > 0)
	{
		// Do actual search
		const offset = page * pageSize - pageSize;
		let params: any = [pageSize, offset];
		let paramIndex = params.length;

		let query = ``;
		let wheres = [];

		if (category === constants.shops.categories.orders)
		{
			query = `
				SELECT
					shop_order.id,
					count(*) over() AS count
				FROM shop_order
			`;

			// Add wheres
			if (shopId)
			{
				params[paramIndex] = shopId;

				paramIndex++;

				wheres.push(`shop_order.shop_id = $` + paramIndex);
			}
			else
			{
				params[paramIndex] = shops.map((s: any) => s.id);

				paramIndex++;

				wheres.push(`shop_order.shop_id = ANY($` + paramIndex + `)`);
			}

			if (type === 'employee')
			{
				params[paramIndex] = shops.filter((s: any) => s.employee).map((s: any) => s.id);

				paramIndex++;

				wheres.push(`shop_order.shop_id = ANY($` + paramIndex + `)`);
			}
			else if (type === 'customer')
			{
				params[paramIndex] = this.userId;

				paramIndex++;

				wheres.push(`shop_order.customer_id = $` + paramIndex);
			}
			else
			{
				params[paramIndex] = this.userId;

				paramIndex++;

				params[paramIndex] = shops.filter((s: any) => s.employee).map((s: any) => s.id);

				paramIndex++;

				wheres.push(`(shop_order.shop_id = ANY($` + paramIndex + `) OR shop_order.customer_id = $` + (paramIndex - 1) + `)`);
			}

			if (status === 'unclaimed')
			{
				wheres.push(`shop_order.employee_id IS NULL`);
			}
			else if (status === 'completed')
			{
				wheres.push(`shop_order.completed IS NOT NULL`);
			}
			else if (status === 'in_progress')
			{
				wheres.push(`shop_order.completed IS NULL AND shop_order.employee_id IS NOT NULL`);
			}
		}
		else if (category === constants.shops.categories.applications)
		{
			const employeeApplications = (await db.query(`
				SELECT shop_user.shop_id
				FROM shop_user
				JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
				WHERE shop_user.user_id = $1 AND shop_user.active = true AND shop_user.shop_id = ANY($2) AND shop_role.applications = true
				GROUP BY shop_user.shop_id
			`, this.userId, shops.map((s: any) => s.id).concat([shopId]))).map((a: any) => a.shop_id);

			query = `
				SELECT
					shop_application.id,
					count(*) over() AS count
				FROM shop_application
			`;

			// Add wheres
			params[paramIndex] = this.userId;

			paramIndex++;

			if (shopId && employeeApplications.includes(shopId))
			{
				params[paramIndex] = shopId;

				paramIndex++;

				wheres.push(`(shop_application.shop_id = $` + paramIndex + ` OR shop_application.user_id = $` + (paramIndex - 1) + `)`);
			}
			else
			{
				params[paramIndex] = employeeApplications;

				paramIndex++;

				wheres.push(`(shop_application.shop_id = ANY($` + paramIndex + `) OR shop_application.user_id = $` + (paramIndex - 1) + `)`);
			}

			if (['yes', 'no'].includes(waitlisted))
			{
				params[paramIndex] = waitlisted === 'yes' ? true : false;

				paramIndex++;

				wheres.push(`shop_application.waitlisted = $` + paramIndex);
			}
		}
		else if (category === constants.shops.categories.threads)
		{
			params[paramIndex] = this.userId;

			paramIndex++;

			query = `
				SELECT
					node.id,
					count(*) over() AS count
				FROM node
				JOIN shop_node ON (shop_node.node_id = node.id)
				LEFT JOIN shop_application ON (shop_application.node_id = node.id)
				LEFT JOIN shop_order on (shop_order.node_id = node.id)
				JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			`;

			// Add wheres
			wheres.push(`shop_application.id IS NULL AND shop_order.id IS NULL`);
			wheres.push(`user_node_permission.user_id = $3 AND user_node_permission.node_permission_id = 1 AND user_node_permission.granted = true`);

			if (shopId)
			{
				params[paramIndex] = shopId;

				paramIndex++;

				wheres.push(`shop_node.shop_id = $` + paramIndex);
			}
			else
			{
				params[paramIndex] = shops.map((s: any) => s.id);

				paramIndex++;

				wheres.push(`shop_node.shop_id = ANY($` + paramIndex + `)`);
			}

			if (locked)
			{
				wheres.push(`node.locked IS NOT NULL`);
			}
			else
			{
				wheres.push(`node.locked IS NULL`);
			}
		}

		if (wheres.length > 0)
		{
			query += `
				WHERE `;

			for (const key in wheres)
			{
				if (Number(key) > 0)
				{
					query += ` AND `;
				}

				query += wheres[key];
			}
		}

		// Add order by
		if (category === constants.shops.categories.orders)
		{
			query += `
				ORDER BY shop_order.ordered DESC
			`;
		}
		else if (category === constants.shops.categories.applications)
		{
			query += `
				ORDER BY shop_application.applied DESC
			`;
		}
		else if (category === constants.shops.categories.threads)
		{
			query += `
				ORDER BY node.creation_time DESC
			`;
		}

		// Add limit
		query += `
			LIMIT $1::int OFFSET $2::int
		`;

		// Run query
		const threads = await db.query(query, ...params);

		if (threads.length > 0)
		{
			results = await Promise.all(threads.map(async (thread: any) =>
			{
				return this.query('v1/shop/thread', { id: thread.id, category: category });
			}));

			count = Number(threads[0].count);
		}
	}

	return <ThreadsType>{
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		shopId: shopId,
		category: category,
		type: type,
		status: status,
		waitlisted: waitlisted,
		locked: locked,
		shops: shops,
		markupStyle: markupStyle ? markupStyle[0].markup_style : null,
	};
}

threads.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	shopId: {
		type: APITypes.number,
		nullable: true,
	},
	category: {
		type: APITypes.string,
		default: constants.shops.categories.orders,
		includes: [constants.shops.categories.orders, constants.shops.categories.applications, constants.shops.categories.threads],
		required: true,
	},
	type: {
		type: APITypes.string,
		default: 'both',
		includes: ['employee', 'customer', 'both'],
		required: true,
	},
	status: {
		type: APITypes.string,
		default: 'all',
		includes: ['unclaimed', 'completed', 'in_progress', 'all'],
	},
	waitlisted: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	locked: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type threadsType = {
	page: number
	shopId: number
	category: string
	type: string
	status: string
	waitlisted: string
	locked: boolean
};

export default threads;
