import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, ShopType } from '@types';

async function save(this: APIThisType, { shopId, services }: saveProps): Promise<SuccessType>
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

	const shop: ShopType = await this.query('v1/shop', { id: shopId });

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	if (!shop.owners.some(o => o.id === this.userId))
	{
		throw new UserError('permission');
	}

	const defaultServices = await Promise.all(services.filter(id => id.startsWith('default_')).map(async(serviceId) =>
	{
		const id = serviceId.substring('default_'.length);

		if (isNaN(id))
		{
			throw new UserError('no-such-service');
		}

		const [service] = await db.query(`
			SELECT id
			FROM shop_default_service
			WHERE id = $1::int
		`, id);

		if (!service)
		{
			throw new UserError('no-such-service');
		}

		return Number(id);
	}));

	services = await Promise.all(services.filter(id => !id.startsWith('default_')).map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-service');
		}

		const [service] = await db.query(`
			SELECT id
			FROM shop_service
			WHERE id = $1::int
		`, id);

		if (!service)
		{
			throw new UserError('no-such-service');
		}

		return Number(id);
	}));

	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				UPDATE shop_service
				SET active = false
				WHERE shop_id = $1
			`, shopId),
			query(`
				UPDATE shop_default_service_shop
				SET active = false
				WHERE shop_id = $1
			`, shopId),
		]);

		await Promise.all([
			Promise.all([
				services.map(async (serviceId) =>
				{
					await query(`
						UPDATE shop_service
						SET active = true
						WHERE id = $1
					`, serviceId);
				}),
			]),
			Promise.all([
				defaultServices.map(async (serviceId) =>
				{
					await query(`
						INSERT INTO shop_default_service_shop (shop_default_service_id, shop_id, active)
						VALUES ($1, $2, true)
						ON CONFLICT (shop_default_service_id, shop_id) DO UPDATE SET active = true
					`, serviceId, shopId);
				}),
			]),
		]);
	});

	return {
		_success: 'Your active services have been updated!',
	};
}

save.apiTypes = {
	shopId: {
		type: APITypes.number,
		required: true,
	},
	services: {
		type: APITypes.array,
		required: true,
	},
};

type saveProps = {
	shopId: number
	services: any[]
};

export default save;
