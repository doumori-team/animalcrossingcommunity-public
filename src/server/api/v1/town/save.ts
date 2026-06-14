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
	// Check parameters
	stores.push(nookId);

	if (gameId > constants.gameIds.ACNL)
	{
		grassShapeId = null;
	}

	// Paint ID at the town level is only meant for the one game where all 4 players share a house.
	if (gameId !== constants.gameIds.ACWW)
	{
		paintId = null;
	}

	if (dreamAddress !== null && [constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) && utils.realStringLength(dreamAddress) > 0)
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

	if (gameId < constants.gameIds.ACNH)
	{
		hemisphereId = null;
	}

	if (gameId !== constants.gameIds.ACGC)
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
		validateGrassShape(grassShapeId), // Grass Shape
		validateOrdinance(ordinanceId), // Ordinance
		validateStores(gameId, stores), // Stores
		validatePublicWorkProjects(gameId, pwps), // Public Work Projects
		validateResidents(gameId, islandResidentId, residents), // AC:GC Island Resident, Residents
		validateHemisphere(hemisphereId), // AC:NH Hemisphere
		validatePaint(gameId, paintId), // AC:WW Roof Paint
	]);

	// Perform queries
	let townUserId;

	if (id > 0)
	{
		const [town] = await db.query(`
			SELECT user_id
			FROM town
			WHERE town.id = $1::int
		`, id);

		if (town.user_id !== this.userId)
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
		townUserId = this.userId;

		this.query('v1/users/badge/check', { badgeId: constants.badges.townallgames });
	}

	// Other areas
	await Promise.all([
		updateFruit.bind(this)(id, fruit, nativeTownFruit, islandFruitId1, islandFruitId2), // Fruit
		updateStores(id, stores), // Stores
		updatePublicWorkProjects(id, pwps), // Public Work Projects
		updateResidents(id, residents), // Residents
		updateIsland(id, islandName, utils.safeNumber(islandResidentId), gameId), // AC:GC Island
	]);

	return {
		id: id,
		userId: townUserId,
	};
}

export async function validateFruit(this: APIThisType, gameId: saveProps['gameId'], fruit: saveProps['fruit'], nativeTownFruit: saveProps['nativeTownFruit'], islandFruitId1: saveProps['islandFruitId1'], islandFruitId2: saveProps['islandFruitId2']): Promise<void>
{
	await Promise.all([
		Promise.all(
			fruit.map(async (fruitId) =>
			{
				const [checkID] = await db.query(`
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
		),
		async function (nativeTownFruit: saveProps['nativeTownFruit'], gameId: saveProps['gameId'])
		{
			const [checkID] = await db.query(`
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
		async function (islandFruitId1: saveProps['islandFruitId1'], gameId: saveProps['gameId'])
		{
			if (islandFruitId1 > 0)
			{
				const [checkID] = await db.query(`
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
		async function (islandFruitId2: saveProps['islandFruitId2'], gameId: saveProps['gameId'])
		{
			if (islandFruitId2 > 0)
			{
				const [checkID] = await db.query(`
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

export async function updateFruit(this: APIThisType, id: saveProps['id'], fruit: saveProps['fruit'], nativeTownFruit: saveProps['nativeTownFruit'], islandFruitId1: saveProps['islandFruitId1'], islandFruitId2: saveProps['islandFruitId2']): Promise<void>
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
		async function (id: saveProps['id'], islandFruitId1: saveProps['islandFruitId1'])
		{
			if (islandFruitId1 > 0)
			{
				await db.query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, islandFruitId1);
			}
		}.bind(this)(id, islandFruitId1),
		async function (id: saveProps['id'], islandFruitId2: saveProps['islandFruitId2'])
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

export async function validateGrassShape(grassShapeId: saveProps['grassShapeId']): Promise<void>
{
	if (grassShapeId === null)
	{
		return;
	}

	const [checkID] = await db.query(`
		SELECT grass_shape.id
		FROM grass_shape
		WHERE grass_shape.id = $1::int
	`, grassShapeId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

export async function validateOrdinance(ordinanceId: saveProps['ordinanceId']): Promise<void>
{
	if (ordinanceId === null)
	{
		return;
	}

	const [checkID] = await db.query(`
		SELECT ordinance.id
		FROM ordinance
		WHERE ordinance.id = $1::int
	`, ordinanceId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

export async function validateStores(gameId: saveProps['gameId'], stores: saveProps['stores']): Promise<void>
{
	await Promise.all(
		stores.map(async (storeId) =>
		{
			const [checkID] = await db.query(`
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
	);
}

export async function updateStores(id: saveProps['id'], stores: saveProps['stores']): Promise<void>
{
	await db.query(`
		DELETE FROM town_store
		WHERE town_id = $1::int
	`, id);

	await Promise.all(
		stores.map(async (storeId) =>
		{
			await db.query(`
				INSERT INTO town_store (town_id, store_id)
				VALUES ($1::int, $2::int)
			`, id, storeId);
		}),
	);
}

export async function validatePublicWorkProjects(gameId: saveProps['gameId'], pwps: saveProps['pwps']): Promise<void>
{
	if (gameId !== constants.gameIds.ACNL && pwps.length > 0 || pwps.length > 30)
	{
		throw new UserError('too-many-pwps');
	}

	if (pwps.length > 0)
	{
		const gamePWPs: PWPsType[number] = (await ACCCache.get(constants.cacheKeys.pwps))[gameId];

		pwps.map(pwpId =>
		{
			if (!gamePWPs.find(p => p.id === pwpId))
			{
				throw new UserError('bad-format');
			}
		});
	}
}

export async function updatePublicWorkProjects(id: saveProps['id'], pwps: saveProps['pwps']): Promise<void>
{
	await db.query(`
		DELETE FROM town_public_work_project
		WHERE town_id = $1::int
	`, id);

	await Promise.all(
		pwps.map(async (pwpId) =>
		{
			await db.query(`
				INSERT INTO town_public_work_project (town_id, pwp_id)
				VALUES ($1::int, $2)
			`, id, pwpId);
		}),
	);
}

export async function validateResidents(gameId: saveProps['gameId'], islandResidentId: saveProps['islandResidentId'], residents: saveProps['residents']): Promise<void>
{
	if (residents.length > 0)
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
	}

	if (gameId === constants.gameIds.ACGC && islandResidentId > 0)
	{
		residents.push(String(islandResidentId));
	}

	if (residents.length > 0)
	{
		const gameResidents: ResidentsType[number] = (await ACCCache.get(constants.cacheKeys.residents))[gameId];

		residents.map(residentId =>
		{
			if (!gameResidents.find(r => r.id === residentId))
			{
				throw new UserError('bad-format');
			}
		});
	}
}

export async function updateResidents(id: saveProps['id'], residents: saveProps['residents']): Promise<void>
{
	await db.query(`
		DELETE FROM town_resident
		WHERE town_id = $1::int
	`, id);

	await Promise.all(
		residents.map(async (residentId) =>
		{
			await db.query(`
				INSERT INTO town_resident (town_id, resident_id)
				VALUES ($1::int, $2)
			`, id, residentId);
		}),
	);
}

export async function updateIsland(id: saveProps['id'], islandName: saveProps['islandName'], islandResidentId: saveProps['islandResidentId'], gameId: saveProps['gameId']): Promise<void>
{
	await db.query(`
		DELETE FROM island
		WHERE town_id = $1::int
	`, id);

	if (gameId !== constants.gameIds.ACGC)
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

export async function validateHemisphere(hemisphereId: saveProps['hemisphereId']): Promise<void>
{
	if (hemisphereId === null)
	{
		return;
	}

	const [checkID] = await db.query(`
		SELECT hemisphere.id
		FROM hemisphere
		WHERE hemisphere.id = $1::int
	`, hemisphereId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

export async function validatePaint(gameId: saveProps['gameId'], paintId: saveProps['paintId']): Promise<void>
{
	if (paintId === null)
	{
		return;
	}

	if (gameId !== constants.gameIds.ACWW)
	{
		throw new UserError('bad-format');
	}

	const [checkID] = await db.query(`
		SELECT ac_game_paint.id
		FROM ac_game_paint
		WHERE ac_game_paint.id = $1::int AND ac_game_paint.game_id = $2::int
	`, paintId, gameId);

	if (!checkID)
	{
		throw new UserError('bad-format');
	}
}

save.permissions = [
	'modify-towns',
	'userId',
];

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
		length: constants.max.keyboardName,
		profanity: true,
	},
	nativeTownFruit: {
		type: APITypes.number,
		required: true,
	},
	islandFruitId1: {
		type: APITypes.number,
		default: 0,
	},
	islandFruitId2: {
		type: APITypes.number,
		default: 0,
	},
	fruit: {
		type: APITypes.array,
		subType: 'number',
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
		subType: 'number',
	},
	nookId: {
		type: APITypes.number,
		default: 0,
	},
	pwps: {
		type: APITypes.array,
		subType: 'string',
	},
	islandName: {
		type: APITypes.string,
		default: '',
		profanity: true,
	},
	islandResidentId: {
		type: APITypes.number,
		default: 0,
	},
	residents: {
		type: APITypes.array,
		subType: 'string',
	},
	hemisphereId: {
		type: APITypes.number,
		default: 0,
	},
	stationShape: {
		type: APITypes.number,
		nullable: true,
	},
	paintId: {
		type: APITypes.number,
		nullable: true,
	},
};

type saveProps = {
	gameId: number
	id: number
	name: string
	nativeTownFruit: number
	islandFruitId1: number
	islandFruitId2: number
	fruit: number[]
	grassShapeId: number | null
	dreamAddress: string | null
	ordinanceId: number | null
	stores: number[]
	nookId: number
	pwps: string[]
	islandName: string
	islandResidentId: number
	residents: string[]
	hemisphereId: number | null
	stationShape: number | null
	paintId: number | null
};

export default save;
