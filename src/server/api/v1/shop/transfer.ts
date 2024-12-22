import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ShopType } from '@types';

async function transfer(this: APIThisType, { id }: transferProps): Promise<void>
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

	const shop: ShopType = await this.query('v1/shop', { id: id });

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	if (!shop.transfer)
	{
		throw new UserError('permission');
	}

	await db.query(`
		INSERT INTO shop_user_role (shop_role_id, shop_user_id)
		VALUES ((SELECT id FROM shop_role WHERE parent_id = null AND shop_id = $1 LIMIT 1), (SELECT id FROM shop_user WHERE user_id = $2))
	`, id, this.userId);
}

transfer.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type transferProps = {
	id: number
};

export default transfer;
