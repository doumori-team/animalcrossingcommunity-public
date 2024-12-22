import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserLiteType, ShopType, MarkupStyleType } from '@types';

async function contact(this: APIThisType, { id, text, format }: contactProps): Promise<{ id: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-shops' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const shop: ShopType = await this.query('v1/shop', { id: id });

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	const user: UserLiteType = await this.query('v1/user_lite', { id: this.userId });

	const contacts = await db.query(`
		SELECT shop_user.user_id
		FROM shop_role
		JOIN shop_user_role ON (shop_user_role.shop_role_id = shop_role.id)
		JOIN shop_user ON (shop_user.id = shop_user_role.shop_user_id)
		WHERE shop_role.shop_id = $1::int AND shop_role.contact = true AND shop_role.active = true AND shop_user.active = true
	`, shop.id);

	const threadId = await db.transaction(async (query: any) =>
	{
		const [thread] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, constants.boardIds.shopThread, this.userId, 'thread');

		const title = `Contact Us: ${user.username}`;

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
			(contacts.length > 0 ? contacts.map((c: any) => c.user_id) : shop.owners.map((o: any) => o.id)).concat([this.userId]).map(async (userId: any) =>
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
			}),
		]);

		await query(`
			INSERT INTO shop_node (shop_id, node_id)
			VALUES ($1::int, $2::int)
		`, shop.id, thread.id);

		return thread.id;
	});

	await this.query('v1/notification/create', { id: threadId, type: constants.notification.types.shopThread });

	return {
		id: threadId,
	};
}

contact.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	text: {
		type: APITypes.string,
		default: '',
		length: constants.max.post1,
		required: true,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
};

type contactProps = {
	id: number
	text: string
	format: MarkupStyleType
};

export default contact;
