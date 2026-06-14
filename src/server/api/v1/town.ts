import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, TownType, ResidentsType, PWPsType, ACGameItemType, GroupItemType } from '@types';

async function town(this: APIThisType, { id }: townProps): Promise<TownType>
{
	const [town]: [{
		id: number
		name: string
		acgame_name: string
		ac_game: string
		game_id: number
		user_id: number
		grass_shape_id: null | number
		grass_shape_name: null | string
		dream_address: null | string
		ordinance: null | string
		ordinance_id: null | number
		hemisphere_id: null | number
		hemisphere: null | string
		map_x: number
		map_y: number
		town_tune_id: null | number
		town_tune_creator_id: null | number
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		town_tune_notes: null | any
		town_tune_name: null | string
		flag_id: null | number
		flag_creator_id: null | number
		flag_name: null | string
		flag_data_url: null | string
		station_shape: null | number
		paint_id: null | number
		paint_name: null | string
		paint_hex: null | string
		map_design_file_id: null | string
	} | undefined] = await db.query(`
		SELECT
			town.id,
			town.name,
			ac_game.name AS acgame_name,
			ac_game.shortname AS ac_game,
			town.game_id,
			town.user_id,
			town.grass_shape_id,
			grass_shape.name AS grass_shape_name,
			town.dream_address,
			ordinance.name AS ordinance,
			town.ordinance_id,
			town.hemisphere_id,
			hemisphere.name AS hemisphere,
			ac_game.map_x,
			ac_game.map_y,
			town.town_tune_id,
			town.town_tune_creator_id,
			encode(town.town_tune_notes, 'escape') AS town_tune_notes,
			town.town_tune_name,
			town.flag_id,
			town.flag_creator_id,
			town.flag_name,
			town.flag_data_url,
			town.station_shape,
			ac_game_paint.id AS paint_id,
			paint.name AS paint_name,
			paint.hex AS paint_hex,
			file.file_id AS map_design_file_id
		FROM town
		JOIN ac_game ON (town.game_id = ac_game.id)
		LEFT JOIN grass_shape ON (town.grass_shape_id = grass_shape.id)
		LEFT JOIN ordinance ON (ordinance.id = town.ordinance_id)
		LEFT JOIN hemisphere ON (hemisphere.id = town.hemisphere_id)
		LEFT JOIN ac_game_paint ON (town.paint_id = ac_game_paint.id)
		LEFT JOIN paint ON (ac_game_paint.paint_id = paint.id)
		LEFT JOIN file ON (file.id = town.map_design_file_id)
		WHERE town.id = $1::int
		GROUP BY town.id, ac_game.name, ac_game.shortname, grass_shape.name, ordinance.name, ac_game.map_x, ac_game.map_y, hemisphere.name, ac_game_paint.id, paint.name, paint.hex, file.file_id
	`, id);

	if (!town)
	{
		throw new UserError('no-such-town');
	}

	const residents: ResidentsType[number] = (await ACCCache.get(constants.cacheKeys.residents))[town.game_id];
	const gamePWPs: PWPsType[number] = (await ACCCache.get(constants.cacheKeys.pwps))[town.game_id];

	const [fruit, nativeFruit, stores, pwps, townResidents, island, characters,
		mapTiles, tuneCreator, museum, flagCreator] = await Promise.all([
		getFruit.bind(this)(town.id),
		getNativeFruit.bind(this)(town.id),
		getStores.bind(this)(town.id),
		getPublicWorkProjects.bind(this)(town.id, gamePWPs),
		getResidents.bind(this)(town.id, residents),
		getIsland.bind(this)(town.id, residents),
		getCharacters.bind(this)(town.id),
		getMapTiles.bind(this)(town.id, town.game_id),
		town.town_tune_creator_id ? this.query('v1/user_lite', { id: town.town_tune_creator_id }) : null,
		getMuseum.bind(this)(town.id, town.game_id),
		town.flag_creator_id ? this.query('v1/user_lite', { id: town.flag_creator_id }) : null,
	]);

	return <TownType>{
		id: town.id,
		name: town.name,
		game: {
			id: town.game_id,
			name: town.acgame_name,
			shortname: town.ac_game,
			mapX: town.map_x,
			mapY: town.map_y,
			identifier: town.ac_game.replace(':', '').toLowerCase(),
		},
		userId: town.user_id,
		grassShape: {
			id: town.grass_shape_id,
			name: town.grass_shape_name,
		},
		dreamAddress: town.dream_address,
		ordinance: {
			id: town.ordinance_id,
			name: town.ordinance,
		},
		fruit: fruit,
		nativeFruit: nativeFruit,
		stores: stores,
		pwps: pwps,
		residents: townResidents,
		island: island,
		characters: characters,
		mapTiles: mapTiles,
		hemisphere: {
			id: town.hemisphere_id,
			name: town.hemisphere,
		},
		tune: town.town_tune_notes ? {
			id: town.town_tune_id,
			name: town.town_tune_name,
			creator: tuneCreator,
			notes: town.town_tune_notes.match(/.{4}/g).map((hex: string) => parseInt(hex, 16)),
			formattedDate: null,
		} : null,
		museum: museum,
		mapDesignUrl: town.map_design_file_id !== null ? `${constants.AWS_URL}/${constants.USER_FILE_DIR2}${town.user_id}/${town.map_design_file_id}` : null,
		// we don't keep all the data necessary to edit the pattern on the town
		// object in case it's deleted, so just make it non-editable
		flag: town.flag_name ? {
			id: town.flag_id,
			name: town.flag_name,
			creator: flagCreator,
			published: true,
			dataUrl: town.flag_data_url,
			gameId: town.game_id,
			gameShortName: town.ac_game,
			formattedDate: null,
			isFavorite: null,
			designId: null,
		} : null,
		stationShape: town.station_shape,
		paint: town.paint_id ? {
			id: town.paint_id,
			name: town.paint_name,
			hex: town.paint_hex,
		} : null,
	};
}

async function getFruit(this: APIThisType, id: number): Promise<TownType['fruit']>
{
	return await db.query(`
		SELECT
			fruit.id,
			fruit.name,
			ac_game_fruit.fruit_group AS group
		FROM fruit
		JOIN town_fruit ON (town_fruit.fruit_id = fruit.id)
		JOIN town ON (town_fruit.town_id = town.id)
		JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = town.game_id)
		WHERE town_fruit.town_id = $1::int
		ORDER BY fruit.name ASC
	`, id);
}

async function getNativeFruit(this: APIThisType, id: number): Promise<TownType['nativeFruit']>
{
	const fruit: { id: number, name: string, group: string }[] = await db.query(`
		SELECT
			fruit.id,
			fruit.name,
			ac_game_fruit.fruit_group AS group
		FROM fruit
		JOIN town_native_fruit ON (town_native_fruit.fruit_id = fruit.id)
		JOIN town ON (town_native_fruit.town_id = town.id)
		JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = town.game_id)
		WHERE town_native_fruit.town_id = $1::int
		ORDER BY fruit.name ASC
	`, id);

	return {
		all: fruit,
		regular: fruit.filter(f => f.group === 'regular'),
		island1: fruit.filter(f => f.group === 'island_1'),
		island2: fruit.filter(f => f.group === 'island_2'),
		special: fruit.filter(f => f.group === 'special'),
		nativeFruitId: fruit.find(f => f.group === 'regular')?.id,
		islandFruitId1: fruit.find(f => f.group === 'island_1')?.id,
		islandFruitId2: fruit.find(f => f.group === 'island_2')?.id,
	};
}

async function getStores(this: APIThisType, id: number): Promise<TownType['stores']>
{
	const stores: { id: number, name: string, store_group: string, filename: string }[] = await db.query(`
		SELECT
			store.id,
			store.name,
			store.store_group,
			store.filename
		FROM store
		JOIN town_store ON (town_store.store_id = store.id)
		WHERE town_store.town_id = $1::int
		ORDER BY store.name ASC
	`, id);

	return {
		others: stores.filter(s => s.store_group === 'other'),
		nook: stores.filter(s => s.store_group === 'nook'),
	};
}

async function getPublicWorkProjects(this: APIThisType, id: number, gamePWPs: PWPsType[number]): Promise<TownType['pwps']>
{
	const townPWPs = (await db.query(`
		SELECT
			pwp_id
		FROM town_public_work_project
		WHERE town_public_work_project.town_id = $1::int
	`, id)).map((tp: { pwp_id: number }) => tp.pwp_id);

	if (townPWPs.length === 0)
	{
		return [];
	}

	return gamePWPs.filter(p => townPWPs.includes(p.id));
}

async function getResidents(this: APIThisType, id: number, residents: ResidentsType[number]): Promise<TownType['residents']>
{
	const townResidentIds = (await db.query(`
		SELECT
			resident_id
		FROM town_resident
		WHERE town_resident.town_id = $1::int
	`, id)).map((tr: { resident_id: number }) => tr.resident_id);

	if (townResidentIds.length === 0)
	{
		return [];
	}

	return residents.filter(r => townResidentIds.includes(r.id) && r.isTown);
}

async function getIsland(this: APIThisType, id: number, residents: ResidentsType[number]): Promise<TownType['island']>
{
	const [island] = await db.query(`
		SELECT
			island.id,
			island.name,
			island.resident_id
		FROM island
		WHERE island.town_id = $1::int
	`, id);

	if (island)
	{
		const resident = residents.find(r => r.id === island.resident_id);
		delete island.resident_id;

		return { ...island,
			resident: resident,
		};
	}

	return null;
}

async function getCharacters(this: APIThisType, id: number): Promise<TownType['characters']>
{
	const characters: { id: number }[] = await db.query(`
		SELECT
			character.id
		FROM character
		WHERE character.town_id = $1::int
	`, id);

	return await Promise.all(characters.map(async character =>
	{
		return this.query('v1/character', { id: character.id });
	}));
}

async function getMapTiles(this: APIThisType, id: number, gameId: number): Promise<TownType['mapTiles']>
{
	const [hexMapTiles] = await db.query(`
		SELECT
			encode(map_tiles, 'escape') AS map_tiles
		FROM town
		WHERE id = $1::int
	`, id);

	if (hexMapTiles.map_tiles)
	{
		return hexMapTiles.map_tiles.match(/.{4}/g).map((hex: string) => parseInt(hex, 16));
	}
	else if (gameId < constants.gameIds.ACNH)
	{
		return utils.getDefaultMapAcres(gameId) as number[];
	}

	return [];
}

async function getMuseum(this: APIThisType, id: number, gameId: number): Promise<TownType['museum']>
{
	let museum: TownType['museum'] = [];

	// all museum groups in the game with genuine (for artwork) items
	const museumGroups: GroupItemType['groups'] = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_theme`))
		.map((category: ACGameItemType[number]['all']['theme'][number]) => category.groups).flat(2)
			.filter((group: ACGameItemType[number]['all']['theme'][number]['groups'][number]) => group.items.some(item => item.museum && item.genuine));

	// list of museum catalog item ids the character has
	const characterCatalogItemIds = (await db.query(`
		SELECT
			catalog_item.catalog_item_id
		FROM catalog_item
		JOIN character ON (character.id = catalog_item.character_id)
		WHERE character.town_id = $1::int AND catalog_item.in_museum = $2
		GROUP BY catalog_item.catalog_item_id
	`, id, true)).map((cci: { catalog_item_id: string }) => cci.catalog_item_id);

	for (let key in museumGroups)
	{
		let group = museumGroups[key];

		museum.push({
			name: group.groupName,
			items: group.items.
				filter(item => item.genuine).
				map(item => ({
					name: item.name,
					owned: item.genuine && characterCatalogItemIds.includes(item.id),
				})),
			total: group.items.filter(item => item.genuine).length,
			count: group.items.filter(item => item.genuine && characterCatalogItemIds.includes(item.id)).length,
		});
	}

	return museum;
}

town.permissions = [
	'view-towns',
	'use-trading-post',
];

town.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type townProps = {
	id: number
};

export default town;
