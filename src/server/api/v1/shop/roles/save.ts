import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, ShopType } from '@types';

async function save(this: APIThisType, {shopId, user, action, roles}: saveProps) : Promise<SuccessType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	const shop:ShopType = await this.query('v1/shop', {id: shopId});

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	if (!shop.owners.some(o => o.id === this.userId))
	{
		throw new UserError('permission');
	}

	const [givenUser] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE LOWER(username) = LOWER($1)
	`, user);

	if (!givenUser)
	{
		throw new UserError('no-such-user');
	}

	roles = await Promise.all(roles.map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-role');
		}

		const [role] = await db.query(`
			SELECT id
			FROM shop_role
			WHERE id = $1::int AND shop_id = $2::int
		`, id, shopId);

		if (!role)
		{
			throw new UserError('no-such-role');
		}

		return Number(id);
	}));

	const [maxEmployees] = await db.query(`
		SELECT count(*) AS count
		FROM shop_user
		WHERE shop_id = $1 AND active = true
	`, shopId);

	if (maxEmployees.count > 500)
	{
		throw new UserError('shop-max-employees');
	}

	// if there is only you as the owner and you're trying to remove yourself as the owner
	// don't allow it (it will mess up how permissions work)
	// they can just deactivate the shop
	if (shop.owners.length === 1 && shop.owners.some(o => o.id === this.userId) && givenUser.id === this.userId)
	{
		const ownerRoleIds = (await db.query(`
			SELECT shop_role.id
			FROM shop_role
			WHERE shop_id = $1 AND active = true AND parent_id IS NULL
		`, shopId)).map((role:any) => role.id);

		if (!roles.some(roleId => ownerRoleIds.includes(roleId)))
		{
			throw new UserError('shop-no-owners');
		}
	}

	const shopUserId = await db.transaction(async (query:any) =>
	{
		let [shopUser] = await db.query(`
			SELECT id, active
			FROM shop_user
			WHERE shop_id = $1 AND user_id = $2
		`, shopId, givenUser.id);

		if (!shopUser)
		{
			if (action === 'add')
			{
				[shopUser] = await query(`
					INSERT INTO shop_user (shop_id, user_id)
					VALUES ($1, $2)
					RETURNING id, active
				`, shopId, givenUser.id);
			}
			else
			{
				return;
			}
		}
		else
		{
			await query(`
				UPDATE shop_user
				SET active = $2
				WHERE id = $1
			`, shopUser.id, action === 'add');

			if (action === 'remove')
			{
				await query(`
					DELETE FROM user_node_permission
					WHERE user_id = $1 AND node_id IN (
						SELECT node_id
						FROM shop_node
						WHERE shop_id = $2
					)
				`, givenUser.id, shopId);
			}

			await query(`
				DELETE FROM shop_user_role
				WHERE shop_user_id = $1
			`, shopUser.id);
		}

		if (roles.length > 0)
		{
			await Promise.all([
				roles.map(async (roleId) => {
					await query(`
						INSERT INTO shop_user_role (shop_role_id, shop_user_id)
						VALUES ($1, $2)
					`, roleId, shopUser.id);
				})
			]);
		}

		return shopUser.id;
	});

	await this.query('v1/notification/create', {id: shopUserId, type: constants.notification.types.shopEmployee});

	return {
		_success: `The shop's employees have been updated!`,
	}
}

save.apiTypes = {
	shopId: {
		type: APITypes.number,
		required: true,
	},
	user: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
	action: {
		type: APITypes.string,
		default: '',
		required: true,
		includes: ['add', 'remove'],
	},
	roles: {
		type: APITypes.array,
	},
}

type saveProps = {
	shopId: number
	user: string
	action: 'add' | 'remove'
	roles: any[]
}

export default save;