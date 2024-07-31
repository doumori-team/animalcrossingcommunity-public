import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, TownType, ResidentsType, PWPsType } from '@types';

async function town(this: APIThisType, {id}: townProps) : Promise<TownType>
{
	const [viewTownsPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-towns'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(viewTownsPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	const [town] = await db.query(`
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
			town.flag_data_url
		FROM town
		JOIN ac_game ON (town.game_id = ac_game.id)
		LEFT JOIN grass_shape ON (town.grass_shape_id = grass_shape.id)
		LEFT JOIN ordinance ON (ordinance.id = town.ordinance_id)
		LEFT JOIN hemisphere ON (hemisphere.id = town.hemisphere_id)
		WHERE town.id = $1::int
		GROUP BY town.id, ac_game.name, ac_game.shortname, grass_shape.name, ordinance.name, ac_game.map_x, ac_game.map_y, hemisphere.name
	`, id);

	if (!town)
	{
		throw new UserError('no-such-town');
	}

	const residents:ResidentsType[number] = (await ACCCache.get(constants.cacheKeys.residents))[town.game_id];
	const gamePWPs:PWPsType[number] = (await ACCCache.get(constants.cacheKeys.pwps))[town.game_id];

	const [fruit, nativeFruit, stores, pwps, townResidents, island, characters,
		mapTiles, tuneCreator, museum, mapDesignData, flagCreator] = await Promise.all([
		getFruit.bind(this)(town.id),
		getNativeFruit.bind(this)(town.id),
		getStores.bind(this)(town.id),
		getPublicWorkProjects.bind(this)(town.id, gamePWPs),
		getResidents.bind(this)(town.id, residents),
		getIsland.bind(this)(town.id, residents),
		getCharacters.bind(this)(town.id),
		getMapTiles.bind(this)(town.id),
		town.town_tune_creator_id ? this.query('v1/user_lite', {id: town.town_tune_creator_id}) : null,
		getMuseum.bind(this)(town.id, town.game_id),
		getMapDesignData.bind(this)(town.id, town.game_id),
		town.flag_creator_id ? this.query('v1/user_lite', {id: town.flag_creator_id}) : null,
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
		tune: town.town_tune_name ? {
			id: town.town_tune_id,
			name: town.town_tune_name,
			creator: tuneCreator,
			notes: town.town_tune_notes.match(/.{4}/g).map((hex:any) => parseInt(hex, 16)),
			formattedDate: null,
		} : null,
		museum: museum,
		mapDesignData: mapDesignData,
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
	};
}

async function getFruit(this: APIThisType, id:number) : Promise<TownType['fruit']>
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

async function getNativeFruit(this: APIThisType, id:number) : Promise<TownType['nativeFruit']>
{
	const fruit = await db.query(`
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
		regular: fruit.filter((f:any) => f.group === 'regular'),
		island1: fruit.filter((f:any) => f.group === 'island_1'),
		island2: fruit.filter((f:any) => f.group === 'island_2'),
		special: fruit.filter((f:any) => f.group === 'special'),
		nativeFruitId: fruit.find((f:any) => f.group === 'regular')?.id,
		islandFruitId1: fruit.find((f:any) => f.group === 'island_1')?.id,
		islandFruitId2: fruit.find((f:any) => f.group === 'island_2')?.id,
	}
}

async function getStores(this: APIThisType, id:number) : Promise<TownType['stores']>
{
	const stores = await db.query(`
		SELECT
			store.id,
			store.name,
			store.store_group
		FROM store
		JOIN town_store ON (town_store.store_id = store.id)
		WHERE town_store.town_id = $1::int
		ORDER BY store.name ASC
	`, id);

	return {
		others: stores.filter((s:any) => s.store_group === 'other'),
		nook: stores.filter((s:any) => s.store_group === 'nook'),
	}
}

async function getPublicWorkProjects(this: APIThisType, id:number, gamePWPs:PWPsType[number]) : Promise<TownType['pwps']>
{
	const townPWPs = (await db.query(`
		SELECT
			pwp_id
		FROM town_public_work_project
		WHERE town_public_work_project.town_id = $1::int
	`, id)).map((tp:any) => tp.pwp_id);

	if (townPWPs.length === 0)
	{
		return [];
	}

	return gamePWPs.filter((p:any) => townPWPs.includes(p.id));
}

async function getResidents(this: APIThisType, id:number, residents:ResidentsType[number]) : Promise<TownType['residents']>
{
	const townResidentIds = (await db.query(`
		SELECT
			resident_id
		FROM town_resident
		WHERE town_resident.town_id = $1::int
	`, id)).map((tr:any) => tr.resident_id);

	if (townResidentIds.length === 0)
	{
		return [];
	}

	return residents.filter((r:any) => townResidentIds.includes(r.id) && r.isTown);
}

async function getIsland(this: APIThisType, id:number, residents:ResidentsType[number]) : Promise<TownType['island']>
{
	let [island] = await db.query(`
		SELECT
			island.id,
			island.name,
			island.resident_id
		FROM island
		WHERE island.town_id = $1::int
	`, id);

	if (island)
	{
		const resident = residents.find((r:any) => r.id === island.resident_id);
		delete island.resident_id;

		return {...island,
			resident: resident,
		}
	}

	return null;
}

async function getCharacters(this: APIThisType, id:number) : Promise<TownType['characters']>
{
	const characters = await db.query(`
		SELECT
			character.id
		FROM character
		WHERE character.town_id = $1::int
	`, id);

	return await Promise.all(characters.map(async (character:any) => {
		return this.query('v1/character', {id: character.id})
	}));
}

async function getMapTiles(this: APIThisType, id:number) : Promise<TownType['mapTiles']>
{
	const [hexMapTiles] = await db.query(`
		SELECT
			encode(map_tiles, 'escape') AS map_tiles
		FROM town
		WHERE id = $1::int
	`, id);

	if (hexMapTiles.map_tiles)
	{
		return hexMapTiles.map_tiles.match(/.{4}/g).map((hex:any) => parseInt(hex, 16));
	}

	return [];
}

async function getMuseum(this: APIThisType, id:number, gameId:number) : Promise<TownType['museum']>
{
	let museum = [];

	// all museum groups in the game with genuine (for artwork) items
	const museumGroups = (await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${gameId}_all_theme`))
		.map((category:any) => category.groups).flat(2)
		.filter((group:any) => group.items.some((item:any) => item.museum && item.genuine));

	// list of museum catalog item ids the character has
	const characterCatalogItemIds = (await db.query(`
		SELECT
			catalog_item.catalog_item_id
		FROM catalog_item
		JOIN character ON (character.id = catalog_item.character_id)
		WHERE character.town_id = $1::int AND catalog_item.in_museum = $2
		GROUP BY catalog_item.catalog_item_id
	`, id, true)).map((cci:any) => cci.catalog_item_id);

	for (let key in museumGroups)
	{
		let group = museumGroups[key];

		museum.push({
			name: group.groupName,
			total: (group.items.filter((item:any) => item.genuine)).length,
			count: (group.items.filter((item:any) => item.genuine && characterCatalogItemIds.includes(item.id))).length,
		});
	}

	return museum;
}

async function getMapDesignData(this: APIThisType, id:number, gameId:number) : Promise<TownType['mapDesignData']>
{
	if (gameId < constants.gameIds.ACNH)
	{
		return null;
	}

	const colors = Object.values(utils.getMapColors(gameId));
	const images = Object.keys(utils.getMapImages(gameId));

	let mapDesignData = {
		'dataUrl': '',
		'colorData': [],
		'cursorData': [],
		'flipData': [],
		'imageData': [],
	};

	const [dataUrl] = await db.query(`
		SELECT
			data_url
		FROM map_design
		WHERE town_id = $1::int
	`, id);

	if (!dataUrl)
	{
		return mapDesignData;
	}

	mapDesignData['dataUrl'] = dataUrl.data_url;

	const [colorData] = await db.query(`
		SELECT
			encode(color_data, 'escape') AS color_data
		FROM map_design
		WHERE town_id = $1::int
	`, id);

	if (colorData.color_data)
	{
		mapDesignData['colorData'] = colorData.color_data.match(/.{4}/g).map((hex:any) => colors[parseInt(hex, 16)]);
	}

	const [cursorData] = await db.query(`
		SELECT
			encode(cursor_data, 'escape') AS cursor_data
		FROM map_design
		WHERE town_id = $1::int
	`, id);

	if (cursorData.cursor_data)
	{
		const rectTypes = constants.town.rectTypes;

		mapDesignData['cursorData'] = cursorData.cursor_data.match(/.{4}/g).map((pos:any) => {
			return (rectTypes as any)[parseInt(pos, 16)].value;
		});
	}

	const [flipData] = await db.query(`
		SELECT
			encode(flip_data, 'escape') AS flip_data
		FROM map_design
		WHERE town_id = $1::int
	`, id);

	if (flipData.flip_data)
	{
		mapDesignData['flipData'] = flipData.flip_data.match(/.{4}/g).map((hex:any) => colors[parseInt(hex, 16)]);
	}

	const [imageData] = await db.query(`
		SELECT
			encode(image_data, 'escape') AS image_data
		FROM map_design
		WHERE town_id = $1::int
	`, id);

	if (imageData.image_data)
	{
		mapDesignData['imageData'] = imageData.image_data.match(/.{4}/g).map((hex:any) => images[parseInt(hex, 16)] ? images[parseInt(hex, 16)] : String(parseInt(hex, 16)));
	}

	return mapDesignData;
}

town.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type townProps = {
	id: number
}

export default town;