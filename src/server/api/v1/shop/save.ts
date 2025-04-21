import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType, ShopType, MarkupStyleType } from '@types';

async function save(this: APIThisType, { id, name, shortDescription, description, format, fee, games,
	perOrders, stackOrQuantities, completeOrders, items, vacationStartDate,
	vacationEndDate, allowTransfer, active, fileId }: saveProps): Promise<{ id: number }>
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

	if (games.length !== perOrders.length)
	{
		throw new UserError('bad-format');
	}

	games = await Promise.all(games.map(async(id, index) =>
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

		const gameId = Number(id);

		if (items.length > 0)
		{
			const catalogItems: ACGameItemType[number]['all']['items'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_items`)).filter((item: any) => item.tradeable);

			items[index].map((id: any) =>
			{
				if (!catalogItems.find(item => item.id === id))
				{
					throw new UserError('bad-format');
				}

				return String(id).trim();
			});
		}

		return gameId;
	}));

	if (items.length > 1000)
	{
		throw new UserError('shop-max-items');
	}

	const shopId = await db.transaction(async (query: any) =>
	{
		if (id != null && id > 0)
		{
			const shop: ShopType = await this.query('v1/shop', { id: id });

			if (!shop)
			{
				throw new UserError('no-such-shop');
			}

			if (!shop.owners.some(o => o.id === this.userId))
			{
				throw new UserError('permission');
			}

			let headerFileId = null;

			if (utils.realStringLength(fileId) > 0)
			{
				const [file] = await query(`
					INSERT INTO file (file_id, name, caption, sequence)
					VALUES ($1, $2, $3, 1)
					RETURNING id
				`, fileId, name, name);

				headerFileId = file.id;
			}

			await Promise.all([
				query(`
					UPDATE shop
					SET name = $2, short_description = $3, description = $4, description_format = $5, free = $6, vacation_start_date = $7, vacation_end_date = $8, allow_transfer = $9, active = $10, header_file_id = $11
					WHERE id = $1
				`, id, name, shortDescription, description, format, !!fee, vacationStartDate, vacationEndDate, allowTransfer, active, headerFileId),
				query(`
					DELETE FROM shop_ac_game
					WHERE shop_id = $1::int
				`, id),
				query(`
					DELETE FROM shop_catalog_item
					WHERE shop_id = $1::int
				`, id),
			]);
		}
		else
		{
			const [shop] = await query(`
				INSERT INTO shop (name, short_description, description, description_format, free, vacation_start_date, vacation_end_date, allow_transfer, active)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				RETURNING id
			`, name, shortDescription, description, format, !!fee, vacationStartDate, vacationEndDate, allowTransfer, active);

			id = shop.id;

			const [[role], [shopUser]] = await Promise.all([
				query(`
					INSERT INTO shop_role (shop_id, name, description, parent_id, contact, applications, apply, stats)
					VALUES ($1, 'Owner', 'The leader of the shop', null, true, true, false, true)
					RETURNING id
				`, id),
				query(`
					INSERT INTO shop_user (shop_id, user_id)
					VALUES ($1, $2)
					RETURNING id
				`, id, this.userId),
			]);

			await query(`
				INSERT INTO shop_user_role (shop_role_id, shop_user_id)
				VALUES ($1, $2)
			`, role.id, shopUser.id);
		}

		await Promise.all([
			games.map(async (gameId, index) =>
			{
				await query(`
					INSERT INTO shop_ac_game (shop_id, game_id, per_order, stack_or_quantity, complete_order)
					VALUES ($1, $2, $3, $4, $5)
				`, id, gameId, perOrders[index], stackOrQuantities[index] ? stackOrQuantities[index] : false, completeOrders[index] ? completeOrders[index] : false);

				if (items.length > 0)
				{
					await Promise.all([
						items[index].map(async (itemId: any) =>
						{
							await query(`
								INSERT INTO shop_catalog_item (shop_id, catalog_item_id, game_id)
								VALUES ($1, $2, $3)
							`, id, itemId, gameId);
						}),
					]);
				}
			}),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, id, constants.userTicket.types.shopName, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, id, constants.userTicket.types.shopShortDescription, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, id, constants.userTicket.types.shopDescription, this.userId),
			query(`
				INSERT INTO shop_audit (shop_id, value, user_id)
				VALUES ($1, $2, $3)
				ON CONFLICT (shop_id, value) DO UPDATE SET user_id = EXCLUDED.user_id
			`, id, constants.userTicket.types.shopImage, this.userId),
		]);

		return id;
	});

	return {
		id: shopId,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		nullable: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopName,
		profanity: true,
	},
	shortDescription: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopShortDescription,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		maxLength: constants.max.shopDescription,
		profanity: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
	fee: {
		type: APITypes.boolean,
		default: 'false',
	},
	games: {
		type: APITypes.array,
		required: true,
	},
	perOrders: {
		type: APITypes.array,
		required: true,
	},
	stackOrQuantities: {
		type: APITypes.array,
	},
	completeOrders: {
		type: APITypes.array,
	},
	items: {
		type: APITypes.multiArray,
	},
	vacationStartDate: {
		type: APITypes.date,
		nullable: true,
	},
	vacationEndDate: {
		type: APITypes.date,
		nullable: true,
	},
	allowTransfer: {
		type: APITypes.boolean,
		default: 'false',
	},
	active: {
		type: APITypes.boolean,
		default: 'false',
	},
	fileId: {
		type: APITypes.string,
		default: '',
		nullable: true,
	},
};

type saveProps = {
	id: number | null
	name: string
	shortDescription: string
	description: string
	format: MarkupStyleType
	fee: boolean
	games: any[]
	perOrders: any[]
	stackOrQuantities: any[]
	completeOrders: any[]
	items: any
	vacationStartDate: string | null
	vacationEndDate: string | null
	allowTransfer: boolean
	active: boolean
	fileId: string
};

export default save;
