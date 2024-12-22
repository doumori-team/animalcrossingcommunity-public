import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, ThreadApplicationType, ThreadOrderType, ShopType, MarkupStyleType } from '@types';

async function create(this: APIThisType, { orderId, applicationId, shopId, title, users, text, format }: createProps): Promise<{ id: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', { id: this.userId });

	if (!Array.isArray(users))
	{
		if (users)
		{
			if (utils.realStringLength(users) > constants.max.addMultipleUsers)
			{
				throw new UserError('bad-format');
			}

			users = users.split(',').map(username => username.trim());
		}
		else
		{
			users = [];
		}
	}

	let userIds: number[] = [], employeeIds: number[] = [];

	await Promise.all(users.map(async (username) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!check)
		{
			throw new UserError('no-such-user');
		}

		const [blocked] = await db.query(`
			SELECT user_id
			FROM block_user
			WHERE block_user_id = $1::int AND user_id = $2::int
		`, this.userId, check.id);

		if (blocked)
		{
			throw new UserError('blocked');
		}

		// if they ordered it or it's an application, they choose to do it.
		// only if not an active employee of the shop
		if (!orderId && !applicationId)
		{
			const [dnc] = await db.query(`
				SELECT user_id
				FROM shop_dnc
				WHERE user_id = $1::int AND NOT EXISTS (
					SELECT user_id
					FROM shop_user
					WHERE shop_id = $2::int AND user_id = $1::int AND active = true
				)
			`, check.id, shopId);

			if (dnc)
			{
				throw new UserError('shop-dnc');
			}
		}

		let userId = Number(check.id);

		if (!userIds.includes(userId) && check.id !== this.userId)
		{
			userIds.push(userId);
		}
	}));

	employeeIds.push(this.userId);

	if (orderId)
	{
		const order: ThreadOrderType = await this.query('v1/shop/thread', { id: orderId, category: constants.shops.categories.orders });

		if (!order.claim)
		{
			throw new UserError('permission');
		}

		userIds.push(order.customer.id);
		shopId = order.shop.id;
	}
	else if (applicationId)
	{
		const application: ThreadApplicationType = await this.query('v1/shop/thread', { id: applicationId, category: constants.shops.categories.applications });

		if (!application.contact)
		{
			throw new UserError('permission');
		}

		userIds.push(application.user.id);
		shopId = application.shop.id;
	}
	else
	{
		const shop: ShopType = await this.query('v1/shop', { id: shopId });

		if (!shop)
		{
			throw new UserError('no-such-shop');
		}

		const [currentEmployee] = await db.query(`
			SELECT shop_user.id
			FROM shop_user
			WHERE shop_user.shop_id = $1 AND shop_user.user_id = $2 AND shop_user.active = true
		`, shop.id, this.userId);

		if (!currentEmployee)
		{
			throw new UserError('permission');
		}
	}

	const [owners, chain] = await Promise.all([
		db.query(`
			SELECT shop_user.user_id
			FROM shop_user
			JOIN shop_user_role ON (shop_user_role.shop_user_id = shop_user.id)
			JOIN shop_role ON (shop_role.id = shop_user_role.shop_role_id)
			WHERE shop_user.shop_id = $1 AND shop_user.active = true AND shop_role.parent_id IS NULL
		`, shopId),
		db.query(`
			WITH RECURSIVE Descendants AS
			(
				SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
				FROM shop_role
				JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
				JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
				WHERE shop_role.shop_id = $1 AND shop_user.active = true AND shop_user.user_id = $2
				UNION ALL
				SELECT shop_role.parent_id, shop_role.id, shop_user.user_id
				FROM shop_role
				JOIN shop_user_role ON (shop_role.id = shop_user_role.shop_role_id)
				JOIN shop_user ON (shop_user_role.shop_user_id = shop_user.id)
				JOIN Descendants D ON (D.parent_id = shop_role.id)
				WHERE shop_user.active = true
			)
			SELECT distinct user_id from Descendants
		`, shopId, this.userId),
	]);

	owners.concat(chain).map((user: any) =>
	{
		if (!employeeIds.includes(user.user_id))
		{
			employeeIds.push(user.user_id);
		}
	});

	const threadId = await db.transaction(async (query: any) =>
	{
		// create thread
		const [thread] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, constants.boardIds.shopThread, this.userId, 'thread');

		await query(`
			INSERT INTO node_revision (node_id, reviser_id, title)
			VALUES ($1::int, $2::int, $3::text)
		`, thread.id, this.userId, title);

		const [message] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, thread.id, this.userId, 'post');

		await query(`
			INSERT INTO node_revision (node_id, reviser_id, content, content_format)
			VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
		`, message.id, this.userId, text, format);

		await Promise.all([
			userIds.map(async (userId) =>
			{
				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.read);

				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.reply);
			}),
			employeeIds.map(async (userId) =>
			{
				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.read);

				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.reply);

				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.lock);

				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.addUsers);

				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
					VALUES ($1::int, $2::int, $3::int, true)
					ON CONFLICT ON CONSTRAINT user_node_permission_pkey DO NOTHING
				`, userId, thread.id, constants.nodePermissions.removeUsers);
			}),
		]);

		if (orderId)
		{
			await query(`
				UPDATE shop_order
				SET employee_id = $1, node_id = $3
				WHERE id = $2
			`, this.userId, orderId, thread.id);
		}
		else if (applicationId)
		{
			await query(`
				UPDATE shop_application
				SET node_id = $2
				WHERE id = $1
			`, applicationId, thread.id);
		}

		await query(`
			INSERT INTO shop_node (shop_id, node_id)
			VALUES ($1, $2)
		`, shopId, thread.id);

		return thread.id;
	});

	await this.query('v1/notification/create', { id: threadId, type: constants.notification.types.shopThread });

	return {
		id: threadId,
	};
}

create.apiTypes = {
	orderId: {
		type: APITypes.number,
		nullable: true,
	},
	applicationId: {
		type: APITypes.number,
		nullable: true,
	},
	shopId: {
		type: APITypes.number,
		nullable: true,
	},
	title: {
		type: APITypes.string,
		default: '',
		length: constants.max.postTitle,
		nullable: true,
		required: true,
		profanity: true,
	},
	users: {
		type: APITypes.string,
		default: '',
	},
	text: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.post1,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
};

type createProps = {
	orderId: number | null
	applicationId: number | null
	shopId: number | null
	title: string
	users: string | any[]
	text: string
	format: MarkupStyleType
};

export default create;
