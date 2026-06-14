import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ShopCatalogType, ShopType } from '@types';

async function catalog(this: APIThisType, { id }: catalogProps): Promise<ShopCatalogType[]>
{
	const shop: ShopType = await this.query('v1/shop', { id: id });

	if (!shop)
	{
		throw new UserError('no-such-shop');
	}

	const games: { game_id: number }[] = await db.query(`
		SELECT shop_ac_game.game_id
		FROM shop_ac_game
		WHERE shop_ac_game.shop_id = $1
	`, shop.id);

	return await Promise.all(
		games.map(async game =>
		{
			return {
				gameId: game.game_id,
				items: await this.query('v1/acgame/catalog', { id: game.game_id, categoryName: 'all', sortBy: 'items' }),
			};
		}),
	);
}

catalog.permissions = [
	'view-shops',
	'userId',
];

catalog.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type catalogProps = {
	id: number
};

export default catalog;
