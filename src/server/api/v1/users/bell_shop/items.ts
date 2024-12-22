import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, BellShopItemsType, UserBellShopItemType } from '@types';

/*
 * Items the user has redeemed from the bell shop.
 */
async function items(this: APIThisType, { id, ignoreExpired = true }: itemsProps): Promise<UserBellShopItemType[]>
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
			user_bell_shop_redeemed.expires,
			user_bell_shop_redeemed.redeemed_by,
			user_account_cache.username
		FROM user_bell_shop_redeemed
		LEFT JOIN user_account_cache ON (user_account_cache.id = user_bell_shop_redeemed.redeemed_by)
		WHERE user_bell_shop_redeemed.user_id = $1::int AND ($2 = true OR ($2 = false AND (expires IS NULL OR expires > now())))
	`, id, ignoreExpired);

	this.query('v1/notification/destroy', {
		id: id,
		type: constants.notification.types.giftBellShop,
	});

	const sortedBellShopItems: BellShopItemsType['all'] = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))['all'];

	return userItems.map((userItem: any) =>
	{
		const item = sortedBellShopItems[userItem.item_id];

		return {
			id: userItem.id,
			itemId: userItem.item_id,
			name: item.name,
			description: item.description,
			avatar: item.avatar,
			redeemed: dateUtils.formatDateTimezone(userItem.redeemed),
			price: `${Number(userItem.price).toLocaleString()} ${userItem.currency}`,
			expires: userItem.expires === null ? null : dateUtils.formatDateTimezone(userItem.expires),
			redeemedBy: userItem.redeemed_by && userItem.redeemed_by != id ? userItem.username : null,
		};
	});
}

items.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
	},
	// ignoreExpired not included on purpose
};

type itemsProps = {
	id: number
	ignoreExpired: boolean
};

export default items;
