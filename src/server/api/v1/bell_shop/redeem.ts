import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, UserBellShopItemType, BellShopItemsType } from '@types';

async function redeem(this: APIThisType, { id, itemId, userId, debug }: redeemProps): Promise<UserBellShopItemType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'purchase-bell-shop' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const itemPrice: BellShopItemsType['price'][number][number] = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))['price'][id][itemId];

	if (!constants.LIVE_SITE && utils.realStringLength(debug) > 0)
	{
		if (!dateUtils.isValid(debug))
		{
			throw new UserError('bad-format');
		}

		if (!itemPrice || dateUtils.isAfterTimezone2(itemPrice.item.releaseDate, debug))
		{
			throw new UserError('no-such-bell-shop-item');
		}
	}
	else
	{
		if (!itemPrice || dateUtils.isAfterCurrentDateTimezone(itemPrice.item.releaseDate))
		{
			throw new UserError('no-such-bell-shop-item');
		}
	}

	const [itemRedeemed] = await db.query(`
		SELECT id
		FROM user_bell_shop_redeemed
		WHERE item_id = $1::int AND (expires IS NULL OR expires > now()) AND user_id = $2::int
	`, itemPrice.item.id, userId);

	if (itemRedeemed)
	{
		throw new UserError('bell-shop-item-redeemed');
	}

	// Confirm user can afford
	const [user, userDonations] = await Promise.all([
		this.query('v1/user', { id: this.userId }),
		this.query('v1/users/donations', { id: this.userId }),
	]);

	let price = itemPrice.price.nonFormattedPrice;

	if (userDonations.monthlyPerks >= 5 && userDonations.monthlyPerks < 10)
	{
		price = price - Math.ceil(price * 0.05);
	}
	else if (userDonations.monthlyPerks >= 10)
	{
		price = price - Math.ceil(price * 0.10);
	}

	if (itemPrice.price.currency === constants.bellShop.currencies.bells)
	{
		if (user.nonFormattedTotalBells - price < 0)
		{
			throw new UserError('bell-shop-not-enough-bells');
		}
	}

	if (this.userId !== userId && itemPrice.price.nonFormattedPrice > constants.bellShop.giftBellLimit)
	{
		throw new UserError('bell-shop-gift-limit');
	}

	// Process
	let redeemed = null;

	if (itemPrice.item.expireDurationMonths === null)
	{
		[redeemed] = await db.query(`
			INSERT INTO user_bell_shop_redeemed (user_id, item_id, price, currency, redeemed_by)
			VALUES ($1::int, $2::int, $3, $4, $5)
			RETURNING id
		`, userId, itemPrice.item.id, price, itemPrice.price.currency, this.userId);
	}
	else
	{
		[redeemed] = await db.query(`
			INSERT INTO user_bell_shop_redeemed (user_id, item_id, price, currency, expires, redeemed_by)
			VALUES ($1::int, $2::int, $3, $4, now() + interval '1 month' * $5::int, $6)
			RETURNING id
		`, userId, itemPrice.item.id, price, itemPrice.price.currency, itemPrice.item.expireDurationMonths, this.userId);
	}

	if (userId && this.userId !== userId)
	{
		await this.query('v1/notification/create', { id: redeemed.id, type: constants.notification.types.giftBellShop });
	}

	return await this.query('v1/users/bell_shop/items', {
		ignoreExpired: false,
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
	userId: {
		type: APITypes.userId,
		default: true,
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
};

type redeemProps = {
	id: number
	itemId: number
	userId: number
	debug: string
};

export default redeem;
