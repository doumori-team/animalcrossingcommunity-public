import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType, ShopType, ACGameItemType } from '@types';

async function order(this: APIThisType, { id, gameId, serviceId, items, quantities, comment }: orderProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'order-apply-shops' });

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

	if (shop.vacation && shop.vacation.current)
	{
		throw new UserError('bad-format');
	}

	if (shop.pendingOrder)
	{
		throw new UserError('bad-format');
	}

	const game = shop.games.find(g => g.id === gameId);

	if (!game)
	{
		throw new UserError('bad-format');
	}

	const [service] = serviceId.startsWith('default_') ? await db.query(`
		SELECT shop_default_service.id
		FROM shop_default_service
		JOIN shop_default_service_shop ON (shop_default_service_shop.shop_default_service_id = shop_default_service.id)
		JOIN shop_default_service_ac_game ON (shop_default_service_ac_game.shop_default_service_id = shop_default_service.id)
		WHERE shop_default_service.id = $1::int AND shop_default_service_shop.shop_id = $2::int AND shop_default_service_ac_game.game_id = $3::int
	`, serviceId.substring('default_'.length), id, gameId) : await db.query(`
		SELECT shop_service.id
		FROM shop_service
		JOIN shop_service_shop ON (shop_service_shop.shop_service_id = shop_service.id)
		JOIN shop_service_ac_game ON (shop_service_ac_game.shop_service_id = shop_service.id)
		WHERE shop_service.id = $1::int AND shop_service_shop.shop_id = $2::int AND shop_service_ac_game.game_id = $3::int
	`, serviceId, id, gameId);

	if (!service)
	{
		throw new UserError('no-such-service');
	}

	if (items.length > 0)
	{
		const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: any) => item.tradeable && !game.items.includes(item.id));

		items = items.map((id) =>
		{
			if (!catalogItems.find(item => item.id === id))
			{
				throw new UserError('bad-format');
			}

			return String(id).trim();
		});

		quantities = quantities.map((quantity) =>
		{
			if (isNaN(quantity))
			{
				throw new UserError('bad-format');
			}

			const newQuantity = Number(quantity);

			// by stack
			if (game.stackOrQuantity)
			{
				if (newQuantity > game.perOrder)
				{
					throw new UserError('too-many-shop-items');
				}
			}

			return newQuantity;
		});

		if (quantities.length !== items.length || quantities.filter(q => q > 0).length === 0)
		{
			throw new UserError('bad-format');
		}
	}

	// total quantity
	if (!game.stackOrQuantity)
	{
		const totalQuantity = quantities.reduce((a, b) => a + b, 0);

		if (totalQuantity > game.perOrder)
		{
			throw new UserError('too-many-shop-items');
		}
	}

	const orderId = await db.transaction(async (query: any) =>
	{
		let order;

		if (serviceId.startsWith('default_'))
		{
			[order] = await query(`
				INSERT INTO shop_order (shop_id, customer_id, shop_default_service_id, comment, game_id)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id
			`, id, this.userId, service.id, comment, gameId);
		}
		else
		{
			[order] = await query(`
				INSERT INTO shop_order (shop_id, customer_id, shop_service_id, comment, game_id)
				VALUES ($1, $2, $3, $4, $5)
				RETURNING id
			`, id, this.userId, service.id, comment, gameId);
		}

		await Promise.all([
			items.map(async (itemId, index) =>
			{
				await query(`
					INSERT INTO shop_order_catalog_item (shop_order_id, catalog_item_id, quantity)
					VALUES ($1, $2, $3)
				`, order.id, itemId, quantities[index]);
			}),
		]);

		return order.id;
	});

	await this.query('v1/notification/create', { id: orderId, type: constants.notification.types.shopOrder });

	return {
		_success: 'Your order has been submitted. You will be notified when an employee has claimed it.',
	};
}

order.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	gameId: {
		type: APITypes.acgameId,
		required: true,
	},
	serviceId: {
		type: APITypes.string,
		required: true,
	},
	items: {
		type: APITypes.array,
	},
	quantities: {
		type: APITypes.array,
	},
	comment: {
		type: APITypes.string,
		default: '',
		length: constants.max.shopOrderComment,
		profanity: true,
	},
};

type orderProps = {
	id: number
	gameId: number
	serviceId: string
	items: any[]
	quantities: any[]
	comment: string
};

export default order;
