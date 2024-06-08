import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function catalog({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-shops'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const shop = await this.query('v1/shop', {id: id});

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
		games.map(async (game) => {
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

export default catalog;