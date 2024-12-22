import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, PWPsType, ResidentsType } from '@types';

async function save(this: APIThisType, { gameId, id, name, nativeTownFruit, islandFruitId1, islandFruitId2,
	fruit, grassShapeId, dreamAddress, ordinanceId, stores, nookId, pwps, islandName,
	islandResidentId, residents, hemisphereId, stationShape, paintId }: saveProps): Promise<{ id: number, userId: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	fruit = await Promise.all(fruit.map(async (id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('bad-format');
		}

		return Number(id);
	}));

	stores.push(nookId);

	stores = await Promise.all(stores.map(async (id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('bad-format');
		}

		return Number(id);
	}));

	if (gameId > constants.gameIds.ACNL)
	{
		grassShapeId = null;
	}

	// Paint ID at the town level is only meant for the one game where all 4 players share a house.
	if (gameId !== constants.gameIds.ACWW)
	{
		paintId = null;
	}

	if (dreamAddress != null && [constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) && utils.realStringLength(dreamAddress) > 0)
	{
		dreamAddress = dreamAddress.toUpperCase();

		if (gameId === constants.gameIds.ACNL && !dreamAddress.match(RegExp(constants.regexes.dreamAddressNL)) ||
			gameId === constants.gameIds.ACNH && !dreamAddress.match(RegExp(constants.regexes.dreamAddressNH)))
		{
			throw new UserError('bad-format');
		}
	}
	else
	{
		dreamAddress = null;
	}

	if (![constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId))
	{
		ordinanceId = null;
	}

	pwps = pwps.map(id =>
	{
		return String(id);
	});

	residents = residents.map(id =>
	{
		return String(id);
	});

	if (gameId < constants.gameIds.ACNH)
	{
		hemisphereId = null;
	}

	if (gameId !== constants.gameIds.ACGC || stationShape === 0)
	{
		stationShape = null;
	}
	else if (stationShape !== null && (stationShape < 1 || stationShape > 15))
	{
		throw new UserError('bad-format');
	}

	// Other area validations
	await Promise.all([
		validateFruit.bind(this)(gameId, fruit, nativeTownFruit, islandFruitId1, islandFruitId2), // Fruit
		validateGrassShape.bind(this)(grassShapeId), // Grass Shape
		validateOrdinance.bind(this)(ordinanceId), // Ordinance
		validateStores.bind(this)(gameId, stores), // Stores
		validatePublicWorkProjects.bind(this)(gameId, pwps), // Public Work Projects
		validateResidents.bind(this)(gameId, islandResidentId, residents), // AC:GC Island Resident, Residents
		validateHemisphere.bind(this)(hemisphereId), // AC:NH Hemisphere
		validatePaint.bind(this)(gameId, paintId), // AC:WW Roof Paint
	]);

	// Perform queries
	let townUserId;

	if (id != null && id > 0)
	{
		const [town] = await db.query(`
			SELECT id, user_id
			FROM town
			WHERE town.id = $1::int
		`, id);

		if (!town)
		{
			throw new UserError('no-such-town');
		}

		if (town.user_id != this.userId)
		{
			throw new UserError('permission');
		}

		townUserId = town.user_id;

		await db.query(`
			UPDATE town
			SET name = $2, grass_shape_id = $3::int, dream_address = $4, ordinance_id = $5::int, hemisphere_id = $6::int, station_shape = $7::int, paint_id = $8
			WHERE town.id = $1::int
		`, id, name, grassShapeId, dreamAddress, ordinanceId, hemisphereId, stationShape, paintId);
	}
	else
	{
		await this.query('v1/user_lite', { id: this.userId });

		const [foundGameId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int AND has_town = true
		`, gameId);

		if (!foundGameId)
		{
			throw new UserError('no-such-ac-game');
		}

		const [towns] = await db.query(`
			SELECT count(*) AS count
			FROM town
			WHERE user_id = $1
		`, this.userId);

		if (towns.count >= constants.max.towns)
		{
			throw new UserError('too-many-towns');
		}

		const [town] = await db.query(`
			INSERT INTO town (name, user_id, game_id, grass_shape_id, dream_address, ordinance_id, hemisphere_id, station_shape, paint_id)
			VALUES ($1, $2::int, $3::int, $4::int, $5, $6::int, $7::int, $8::int, $9)
			RETURNING id
		`, name, this.userId, gameId, grassShapeId, dreamAddress, ordinanceId, hemisphereId, stationShape, paintId);

		id = Number(town.id);

		await Promise.all([
			createDefaultMap.bind(this)(id, gameId),
		]);

		townUserId = this.userId;
	}

	// Other areas
	id = Number(id);

	await Promise.all([
		updateFruit.bind(this)(id, fruit, nativeTownFruit, islandFruitId1, islandFruitId2), // Fruit
		updateStores.bind(this)(id, stores), // Stores
		updatePublicWorkProjects.bind(this)(id, pwps), // Public Work Projects
		updateResidents.bind(this)(id, residents), // Residents
		updateIsland.bind(this)(id, islandName, Number(islandResidentId || 0), gameId), // AC:GC Island
	]);

	return {
		id: id,
		userId: townUserId,
	};
}

async function validateFruit(this: any, gameId: number, fruit: any[], nativeTownFruit: number, islandFruitId1: number, islandFruitId2: number): Promise<void>
{
	await Promise.all([
		Promise.all([
			fruit.map(async (fruitId) =>
			{
				let [checkID] = await db.query(`
					SELECT fruit.id
					FROM fruit
					JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $2::int)
					WHERE fruit.id = $1::int
				`, fruitId, gameId);

				if (!checkID)
				{
					throw new UserError('bad-format');
				}
			}),
		]),
		async function (nativeTownFruit: number, gameId: number)
		{
			let [checkID] = await db.query(`
				SELECT fruit.id
				FROM fruit
				JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $2::int)
				WHERE fruit.id = $1::int AND ac_game_fruit.fruit_group = 'regular'
			`, nativeTownFruit, gameId);

			if (!checkID)
			{
				throw new UserError('bad-format');
			}
		}.bind(this)(nativeTownFruit, gameId),
		async function (islandFruitId1: number, gameId: number)
		{
			if (islandFruitId1 > 0)
			{
				let [checkID] = await db.query(`
					SELECT fruit.id
					FROM fruit
					JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $2::int)
					WHERE fruit.id = $1::int AND ac_game_fruit.fruit_group = 'island_1'
				`, islandFruitId1, gameId);

				if (!checkID)
				{
					throw new UserError('bad-format');
				}
			}
		}.bind(this)(islandFruitId1, gameId),
		async function (islandFruitId2: number, gameId: number)
		{
			if (islandFruitId2 > 0)
			{
				let [checkID] = await db.query(`
					SELECT fruit.id
					FROM fruit
					JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $2::int)
					WHERE fruit.id = $1::int AND ac_game_fruit.fruit_group = 'island_2'
				`, islandFruitId2, gameId);

				if (!checkID)
				{
					throw new UserError('bad-format');
				}
			}
		}.bind(this)(islandFruitId2, gameId),
	]);
}

async function updateFruit(this: any, id: number, fruit: any[], nativeTownFruit: number, islandFruitId1: number, islandFruitId2: number): Promise<void>
{
	await Promise.all([
		db.query(`
			DELETE FROM town_fruit
			WHERE town_id = $1::int
		`, id),
		db.query(`
			DELETE FROM town_native_fruit
			WHERE town_id = $1::int
		`, id),
	]);

	await Promise.all([
		Promise.all([
			fruit.map(async (fruitId) =>
			{
				await db.query(`
					INSERT INTO town_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, fruitId);
			}),
		]),
		db.query(`
			INSERT INTO town_native_fruit (town_id, fruit_id)
			VALUES ($1::int, $2::int)
		`, id, nativeTownFruit),
		async function (id: number, islandFruitId1: number)
		{
			if (islandFruitId1 > 0)
			{
				await db.query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, islandFruitId1);
			}
		}.bind(this)(id, islandFruitId1),
		async function (id: number, islandFruitId2: number)
		{
			if (islandFruitId2 > 0)
			{
				await db.query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, islandFruitId2);
			}
		}.bind(this)(id, islandFruitId2),
	]);
}

async function validateGrassShape(grassShapeId: number | null): Promise<void>
{
	if (grassShapeId == null)
	{
		return;
	}

	let [checkID] = await db.query(`
		SELECT grass_shape.id
		FROM grass_shape
		WHERE grass_shape.id = $1::int
	`, grassShapeId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

async function validateOrdinance(ordinanceId: number | null): Promise<void>
{
	if (ordinanceId === null)
	{
		return;
	}

	let [checkID] = await db.query(`
		SELECT ordinance.id
		FROM ordinance
		WHERE ordinance.id = $1::int
	`, ordinanceId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

async function validateStores(gameId: number, stores: any[]): Promise<void>
{
	await Promise.all([
		stores.map(async (storeId) =>
		{
			let [checkID] = await db.query(`
				SELECT store.id
				FROM store
				JOIN ac_game_store ON (ac_game_store.store_id = store.id AND ac_game_store.game_id = $2::int)
				WHERE store.id = $1::int
			`, storeId, gameId);

			if (!checkID)
			{
				throw new UserError('bad-format');
			}
		}),
	]);
}

async function updateStores(id: number, stores: any[]): Promise<void>
{
	await db.query(`
		DELETE FROM town_store
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		stores.map(async (storeId) =>
		{
			await db.query(`
				INSERT INTO town_store (town_id, store_id)
				VALUES ($1::int, $2::int)
			`, id, storeId);
		}),
	]);
}

async function validatePublicWorkProjects(gameId: number, pwps: any[]): Promise<void>
{
	if (gameId != constants.gameIds.ACNL && pwps.length > 0 || pwps.length > 30)
	{
		throw new UserError('too-many-pwps');
	}

	const gamePWPs: PWPsType[number] = (await ACCCache.get(constants.cacheKeys.pwps))[gameId];

	pwps.map(pwpId =>
	{
		if (!gamePWPs.find(p => p.id === pwpId))
		{
			throw new UserError('bad-format');
		}
	});
}

async function updatePublicWorkProjects(id: number, pwps: any[]): Promise<void>
{
	await db.query(`
		DELETE FROM town_public_work_project
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		pwps.map(async (pwpId) =>
		{
			await db.query(`
				INSERT INTO town_public_work_project (town_id, pwp_id)
				VALUES ($1::int, $2)
			`, id, pwpId);
		}),
	]);
}

async function validateResidents(gameId: number, islandResidentId: string, residents: any[]): Promise<void>
{
	const [acgame] = await db.query(`
		SELECT max_residents
		FROM ac_game
		WHERE ac_game.id = $1::int
	`, gameId);

	if (residents.length > acgame.max_residents)
	{
		throw new UserError('too-many-residents');
	}

	if (gameId == constants.gameIds.ACGC && Number(islandResidentId) > 0)
	{
		residents.push(islandResidentId);
	}

	const gameResidents: ResidentsType[number] = (await ACCCache.get(constants.cacheKeys.residents))[gameId];

	await Promise.all([
		residents.map(async (residentId) =>
		{
			if (!gameResidents.find(r => r.id === residentId))
			{
				throw new UserError('bad-format');
			}
		}),
	]);
}

async function updateResidents(id: number, residents: any[]): Promise<void>
{
	await db.query(`
		DELETE FROM town_resident
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		residents.map(async (residentId) =>
		{
			await db.query(`
				INSERT INTO town_resident (town_id, resident_id)
				VALUES ($1::int, $2)
			`, id, residentId);
		}),
	]);
}

async function updateIsland(id: number, islandName: string, islandResidentId: number, gameId: number): Promise<void>
{
	await db.query(`
		DELETE FROM island
		WHERE town_id = $1::int
	`, id);

	if (gameId != constants.gameIds.ACGC)
	{
		return;
	}

	if (utils.realStringLength(islandName) > 0 && islandResidentId > 0)
	{
		await db.query(`
			INSERT INTO island (name, town_id, resident_id)
			VALUES ($1, $2::int, $3::int)
		`, islandName, id, islandResidentId);
	}
}

async function validateHemisphere(hemisphereId: number | null): Promise<void>
{
	if (hemisphereId === null)
	{
		return;
	}

	let [checkID] = await db.query(`
		SELECT hemisphere.id
		FROM hemisphere
		WHERE hemisphere.id = $1::int
	`, hemisphereId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

async function createDefaultMap(this: APIThisType, id: number, gameId: number): Promise<void>
{
	if (gameId === constants.gameIds.ACNH)
	{
		// don't default a map for NH
		return;
	}

	const acres = utils.getDefaultMapAcres(gameId);

	await this.query('v1/town/map/save', { townId: id, acres: acres });
}

async function validatePaint(gameId: number, paintId: number | null): Promise<void>
{
	if (paintId === null)
	{
		return;
	}

	if (gameId !== constants.gameIds.ACWW)
	{
		throw new UserError('bad-format');
	}

	let [checkID] = await db.query(`
		SELECT ac_game_paint.id
		FROM ac_game_paint
		WHERE ac_game_paint.id = $1::int AND ac_game_paint.game_id = $2::int
	`, paintId, gameId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

save.apiTypes = {
	gameId: {
		type: APITypes.acgameId,
		required: true,
	},
	id: {
		type: APITypes.townId,
		nullable: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-town-name',
		length: constants.max.keyboardName,
		profanity: true,
	},
	nativeTownFruit: {
		type: APITypes.number,
	},
	islandFruitId1: {
		type: APITypes.number,
	},
	islandFruitId2: {
		type: APITypes.number,
	},
	fruit: {
		type: APITypes.array,
	},
	grassShapeId: {
		type: APITypes.number,
		nullable: true,
	},
	dreamAddress: {
		type: APITypes.string,
		default: '',
	},
	ordinanceId: {
		type: APITypes.number,
		default: 1,
	},
	stores: {
		type: APITypes.array,
	},
	nookId: {
		type: APITypes.number,
	},
	pwps: {
		type: APITypes.array,
	},
	islandName: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	islandResidentId: {
		type: APITypes.string,
	},
	residents: {
		type: APITypes.array,
	},
	hemisphereId: {
		type: APITypes.number,
		default: 0,
	},
	paintId: {
		type: APITypes.number,
		nullable: true,
	},
};

type saveProps = {
	gameId: number
	id: number | null
	name: string
	nativeTownFruit: number
	islandFruitId1: number
	islandFruitId2: number
	fruit: any[]
	grassShapeId: number | null
	dreamAddress: string | null
	ordinanceId: number | null
	stores: any[]
	nookId: any[]
	pwps: any[]
	islandName: string
	islandResidentId: string
	residents: any[]
	hemisphereId: number | null
	stationShape: number | null
	paintId: number | null
};

export default save;
