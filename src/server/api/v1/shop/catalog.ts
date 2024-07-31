import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ShopCatalogType, ShopType } from '@types';

async function catalog(this: APIThisType, {id}: catalogProps) : Promise<ShopCatalogType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'view-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	const shop:ShopType = await this.query('v1/shop', {id: id});

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	const games = await db.query(`
		SELECT shop_ac_game.game_id
		FROM shop_ac_game
		WHERE shop_ac_game.shop_id = $1
	`, shop.id);

	return await Promise.all(
		games.map(async (game:any) => {
			return {
				gameId: game.game_id,
				items: await this.query('v1/acgame/catalog', {id: game.game_id, categoryName: 'all', sortBy: 'items'}),
			};
		})
	);
}

catalog.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type catalogProps = {
	id: number
}

export default catalog;