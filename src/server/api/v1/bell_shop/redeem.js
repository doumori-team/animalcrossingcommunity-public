import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { sortedBellShopItems } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';

async function redeem({id, itemId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const itemPrice = sortedBellShopItems['price'][id][itemId];

	if (!itemPrice)
	{
		throw new UserError('no-such-bell-shop-item');
	}

	const [itemRedeemed] = await db.query(`
		SELECT
			id
		FROM user_bell_shop_redeemed
		WHERE item_id = $1::int AND (expires IS NULL OR expires > now()) AND user_id = $2::int
	`, itemPrice.item.id, this.userId);

	if (itemRedeemed)
	{
		throw new UserError('bell-shop-item-redeemed');
	}

	// Confirm user can afford
	const user = await this.query('v1/user', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (itemPrice.price.currency === constants.bellShop.currencies.bells)
	{
		if ((user.nonFormattedTotalBells - itemPrice.price.nonFormattedPrice) < 0)
		{
			throw new UserError('bell-shop-not-enough-bells');
		}
	}

	// Process
	if (itemPrice.item.expireDurationMonths === null)
	{
		await db.query(`
			INSERT INTO user_bell_shop_redeemed (user_id, item_id, price, currency)
			VALUES ($1::int, $2::int, $3, $4)
		`, this.userId, itemPrice.item.id, itemPrice.price.nonFormattedPrice, itemPrice.price.currency);
	}
	else
	{
		await db.query(`
			INSERT INTO user_bell_shop_redeemed (user_id, item_id, price, currency, expires)
			VALUES ($1::int, $2::int, $3, $4, now() + interval '1 month' * $5::int)
		`, this.userId, itemPrice.item.id, itemPrice.price.nonFormattedPrice, itemPrice.price.currency, itemPrice.item.expireDurationMonths);
	}

	return await this.query('v1/users/bell_shop/items', {
		ignoreExpired: false
	});
}

redeem.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	itemId: {
		type: APITypes.number,
		required: true,
	},
}

export default redeem;