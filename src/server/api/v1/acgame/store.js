import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';

async function store({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const stores = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			store.id,
			store.name,
			store.store_group AS group
		FROM store
		JOIN ac_game_store ON (store.id = ac_game_store.store_id AND ac_game_store.game_id = $1::int)
		ORDER BY ac_game_store.id ASC
	`, id);

	return {
		others: stores.filter(s => s.group === 'other').sort((a, b) => a.name.localeCompare(b.name)),
		nooks: stores.filter(s => s.group === 'nook'),
	}
}

store.apiTypes = {
	id: {
		type: APITypes.acgameId,
	},
}

export default store;