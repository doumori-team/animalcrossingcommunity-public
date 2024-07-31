import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, ShopType } from '@types';

async function save(this: APIThisType, {id, shopId, name, description, parentId, positions, apply,
	contact, active, applications, services, stats}: saveProps) : Promise<SuccessType>
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

	if (parentId != null && parentId > 0)
	{
		const [parentRole] = await db.query(`
			SELECT id
			FROM shop_role
			WHERE id = $1 AND shop_id = $2
		`, parentId, shopId);

		if (!parentRole)
		{
			throw new UserError('no-such-role');
		}
	}

	const defaultServices = await Promise.all(services.filter((id:any) => id.startsWith('default_')).map(async(serviceId) =>
	{
		const serviceId2 = serviceId.substring('default_'.length);

		if (isNaN(serviceId2))
		{
			throw new UserError('no-such-service');
		}

		const [service] = await db.query(`
			SELECT shop_default_service_id
			FROM shop_default_service_shop
			WHERE shop_default_service_id = $1::int AND shop_id = $2::int
		`, serviceId2, shopId);

		if (!service)
		{
			throw new UserError('no-such-service');
		}

		return Number(serviceId2);
	}));

	services = await Promise.all(services.filter((id:any) => !id.startsWith('default_')).map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-service');
		}

		const [service] = await db.query(`
			SELECT id
			FROM shop_service
			WHERE id = $1::int AND shop_id = $2::int
		`, id, shopId);

		if (!service)
		{
			throw new UserError('no-such-service');
		}

		return Number(id);
	}));

	const [roles] = await db.query(`
		SELECT count(*) AS count
		FROM shop_role
		WHERE shop_id = $1
	`, id);

	if (roles.count > 200)
	{
		throw new UserError('shop-max-roles');
	}

	await db.transaction(async (query:any) =>
	{
		if (id != null && id > 0)
		{
			const [role] = await query(`
				SELECT id
				FROM shop_role
				WHERE id = $1 AND shop_id = $2
			`, id, shopId);

			if (!role)
			{
				throw new UserError('no-such-role');
			}

			await Promise.all([
				query(`
					UPDATE shop_role
					SET shop_id = $2, name = $3, description = $4, parent_id = $5, positions = $6, apply = $7, contact = $8, active = $9, applications = $10, stats = $11
					WHERE id = $1
				`, id, shopId, name, description, parentId, positions, apply, contact, active, applications, stats),
				query(`
					DELETE FROM shop_role_service
					WHERE shop_role_id = $1
				`, id),
				query(`
					DELETE FROM shop_role_default_service
					WHERE shop_role_id = $1
				`, id),
			]);
		}
		else
		{
			const [role] = await query(`
				INSERT INTO shop_role (shop_id, name, description, parent_id, positions, apply, contact, active, applications, stats)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
				RETURNING id
			`, shopId, name, description, parentId, positions, apply, contact, active, applications, stats);

			id = role.id;
		}

		await Promise.all([
			Promise.all([
				services.map(async (serviceId:any) => {
					await query(`
						INSERT INTO shop_role_service (shop_role_id, shop_service_id)
						VALUES ($1, $2)
					`, id, serviceId);
				})
			]),
			Promise.all([
				defaultServices.map(async (serviceId:any) => {
					await query(`
						INSERT INTO shop_role_default_service (shop_role_id, shop_default_service_id)
						VALUES ($1, $2)
					`, id, serviceId);
				})
			]),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopRoleName, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopRoleDescription, this.userId),
		]);
	});

	return {
		_success: `The role has been added / updated!`,
	}
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		nullable: true,
	},
	shopId: {
		type: APITypes.number,
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopRoleName,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopRoleDescription,
		profanity: true,
	},
	parentId: {
		type: APITypes.number,
		nullable: true,
	},
	positions: {
		type: APITypes.number,
		required: true,
		max: constants.max.shopMaxPositions,
	},
	apply: {
		type: APITypes.boolean,
		default: 'false',
	},
	contact: {
		type: APITypes.boolean,
		default: 'false',
	},
	active: {
		type: APITypes.boolean,
		default: 'false',
	},
	applications: {
		type: APITypes.boolean,
		default: 'false',
	},
	services: {
		type: APITypes.array,
	},
	stats: {
		type: APITypes.boolean,
		default: 'false',
	},
}

type saveProps = {
	id: number|null
	shopId: number
	name: string
	description: string
	parentId: number|null
	positions: number
	apply: boolean
	contact: boolean
	active: boolean
	applications: boolean
	services: any[]
	stats: boolean
}

export default save;