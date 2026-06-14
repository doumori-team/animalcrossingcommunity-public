import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, StoreType } from '@types';

async function store(this: APIThisType, { id }: storeProps): Promise<StoreType>
{
	const stores: { id: number, name: string, filename: string, group: string }[] = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			store.id,
			store.name,
			store.filename,
			store.store_group AS group
		FROM store
		JOIN ac_game_store ON (store.id = ac_game_store.store_id AND ac_game_store.game_id = $1::int)
		ORDER BY ac_game_store.id ASC
	`, id);

	return {
		others: stores.filter(s => s.group === 'other').sort((a, b) => a.name.localeCompare(b.name)),
		nooks: stores.filter(s => s.group === 'nook'),
	};
}

store.permissions = [
	'modify-towns',
];

store.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type storeProps = {
	id: number
};

export default store;
