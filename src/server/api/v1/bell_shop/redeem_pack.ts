import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserBellShopItemType, UserType, UserDonationsType, BellShopPackType } from '@types';

async function redeemPack(this: APIThisType, { id, categoryId, debug }: redeemPackProps): Promise<UserBellShopItemType[]>
{
	const packs: BellShopPackType[] = await this.query('v1/bell_shop/packs', { categoryId: categoryId, debug: debug });

	const pack = packs.find(x => x.name === id);

	if (!pack)
	{
		throw new UserError('bad-format');
	}

	let items: BellShopPackType['items'][number][] = [];

	for (let item of pack.items)
	{
		if (!constants.LIVE_SITE && utils.realStringLength(debug) > 0)
		{
			if (!dateUtils.isValid(debug))
			{
				throw new UserError('bad-format');
			}

			if (dateUtils.isAfterTimezone2(item.releaseDate, debug))
			{
				throw new UserError('no-such-bell-shop-item');
			}
		}
		else
		{
			if (dateUtils.isAfterCurrentDateTimezone(item.releaseDate))
			{
				throw new UserError('no-such-bell-shop-item');
			}
		}

		const [itemRedeemed] = await db.query(`
			SELECT id
			FROM user_bell_shop_redeemed
			WHERE item_id = $1::int AND (expires IS NULL OR expires > now()) AND user_id = $2::int
		`, item.id, this.userId);

		if (itemRedeemed)
		{
			throw new UserError('bell-shop-item-redeemed');
		}

		items.push(item);
	}

	const [user, userDonations]: [UserType, UserDonationsType] = await Promise.all([
		this.query('v1/user', { id: this.userId }),
		this.query('v1/users/donations', { id: this.userId }),
	]);

	let packPrice = 0;

	for (let item of items)
	{
		const itemPrice = item.prices[0];
		let price = itemPrice.nonFormattedPrice;

		if (userDonations.monthlyPerks >= 5 && userDonations.monthlyPerks < 10)
		{
			price = price - Math.ceil(price * 0.05);
		}
		else if (userDonations.monthlyPerks >= 10)
		{
			price = price - Math.ceil(price * 0.10);
		}

		packPrice += price;
	}

	let newPrice = packPrice - packPrice * 0.20;

	if (newPrice > 100)
	{
		packPrice = newPrice;
	}

	if (user.nonFormattedTotalBells - packPrice < 0)
	{
		throw new UserError('bell-shop-not-enough-bells');
	}

	// Process
	await db.query(`
		INSERT INTO user_bell_shop_redeemed (user_id, item_id, price, currency, redeemed_by)
		VALUES ($1::int, unnest($2::int[]), $3, $4, $5)
	`, this.userId, items.map(x => x.id), packPrice, 'Bells', this.userId);

	return await this.query('v1/users/bell_shop/items', {
		ignoreExpired: false,
	});
}

redeemPack.permissions = [
	'purchase-bell-shop',
	'userId',
];

redeemPack.apiTypes = {
	id: {
		type: APITypes.string,
		required: true,
	},
	categoryId: {
		type: APITypes.number,
		required: true,
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
};

type redeemPackProps = {
	id: string
	categoryId: number
	debug: string
};

export default redeemPack;
