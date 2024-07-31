import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, ShopType } from '@types';

async function save(this: APIThisType, {id, shopId, name, description, games}: saveProps) : Promise<SuccessType>
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

	games = await Promise.all(games.map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-ac-game');
		}

		const [game] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int
		`, id);

		if (!game)
		{
			throw new UserError('no-such-ac-game');
		}

		return Number(id);
	}));

	const [services] = await db.query(`
		SELECT count(*) AS count
		FROM shop_service
		WHERE shop_id = $1
	`, id);

	if (services.count > 50)
	{
		throw new UserError('shop-max-services');
	}

	await db.transaction(async (query:any) =>
	{
		if (id != null && id > 0)
		{
			const [service] = await query(`
				SELECT id
				FROM shop_service
				WHERE id = $1 AND shop_id = $2
			`, id, shopId);

			if (!service)
			{
				throw new UserError('no-such-service');
			}

			await Promise.all([
				query(`
					UPDATE shop_service
					SET name = $2, description = $3
					WHERE id = $1
				`, id, name, description),
				query(`
					DELETE FROM shop_service_ac_game
					WHERE shop_service_id = $1
				`, id),
			]);
		}
		else
		{
			const [service] = await query(`
				INSERT INTO shop_service (name, description, shop_id)
				VALUES ($1, $2, $3)
				RETURNING id
			`, name, description, shopId);

			id = service.id;
		}

		await Promise.all([
			games.map(async (gameId) => {
				await query(`
					INSERT INTO shop_service_ac_game (shop_service_id, game_id)
					VALUES ($1, $2)
				`, id, gameId);
			}),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopServiceName, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, shopId, constants.userTicket.types.shopServiceDescription, this.userId),
		]);
	});

	return {
		_success: `Your service has been added / updated!`,
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
		maxLength: constants.max.shopName,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopDescription,
		profanity: true,
	},
	games: {
		type: APITypes.array,
	},
}

type saveProps = {
	id: number|null
	shopId: number
	name: string
	description: string
	games: any[]
}

export default save;