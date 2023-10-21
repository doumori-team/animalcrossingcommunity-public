import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils } from '@utils';
import { sortedBellShopItems } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';

/*
 * Items the user has redeemed from the bell shop.
 */
async function items({id, ignoreExpired = true})
{
	if (id != this.userId)
	{
		throw new UserError('permission');
	}

	const userItems = await db.query(`
		SELECT
			user_bell_shop_redeemed.id,
			user_bell_shop_redeemed.item_id,
			user_bell_shop_redeemed.redeemed,
			user_bell_shop_redeemed.price,
			user_bell_shop_redeemed.currency,
			user_bell_shop_redeemed.expires
		FROM user_bell_shop_redeemed
		WHERE user_bell_shop_redeemed.user_id = $1::int AND ($2 = true OR ($2 = false AND (expires IS NULL OR expires > now())))
	`, id, ignoreExpired);

	return userItems.map(userItem => {
		const item = sortedBellShopItems['all'][userItem.item_id];

		return {
			id: userItem.id,
			itemId: userItem.item_id,
			name: item.name,
			description: item.description,
			image: item.image,
			avatar: item.avatar,
			redeemed: dateUtils.formatDateTimezone(userItem.redeemed),
			price: `${Number(userItem.price).toLocaleString()} ${userItem.currency}`,
			expires: userItem.expires === null ? null : dateUtils.formatDateTimezone(userItem.expires),
		};
	});
}

items.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
	// ignoreExpired not included on purpose
}

export default items;