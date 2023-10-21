import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import { residents as sortedResidents } from '@/catalog/residents.js';
import { getPWPs } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';

async function save({gameId, id, name, nativeTownFruit, islandFruitId1, islandFruitId2,
	fruit, grassShapeId, dreamAddress, ordinanceId, stores, nookId, pwps, islandName,
	islandResidentId, residents, hemisphereId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

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

	dreamAddress = dreamAddress.toUpperCase();

	if ([constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) && utils.realStringLength(dreamAddress) > 0)
	{
		if ((gameId === constants.gameIds.ACNL && !dreamAddress.match(RegExp(constants.regexes.dreamAddressNL))) ||
			(gameId === constants.gameIds.ACNH && !dreamAddress.match(RegExp(constants.regexes.dreamAddressNH))))
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

	// Other area validations
	await Promise.all([
		validateFruit.bind(this)(gameId, fruit, nativeTownFruit, islandFruitId1, islandFruitId2), // Fruit
		validateGrassShape.bind(this)(grassShapeId), // Grass Shape
		validateOrdinance.bind(this)(ordinanceId), // Ordinance
		validateStores.bind(this)(gameId, stores), // Stores
		validatePublicWorkProjects.bind(this)(gameId, pwps), // Public Work Projects
		validateResidents.bind(this)(gameId, islandResidentId, residents), // AC:GC Island Resident, Residents
		validateHemisphere.bind(this)(hemisphereId), // AC:NH Hemisphere
	]);

	// Perform queries
	let townUserId;

	if (id > 0)
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
			SET name = $2, grass_shape_id = $3::int, dream_address = $4, ordinance_id = $5::int, hemisphere_id = $6::int
			WHERE town.id = $1::int
		`, id, name, grassShapeId, dreamAddress, ordinanceId, hemisphereId);
	}
	else
	{
		const user = await this.query('v1/user_lite', {id: this.userId});

		if (typeof(user) === 'undefined' || user.length === 0)
		{
			throw new UserError('no-such-user');
		}

		const [foundGameId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int AND has_town = true
		`, gameId);

		if (!foundGameId)
		{
			throw new UserError('no-such-ac-game');
		}

		const [town] = await db.query(`
			INSERT INTO town (name, user_id, game_id, grass_shape_id, dream_address, ordinance_id, hemisphere_id)
			VALUES ($1, $2::int, $3::int, $4::int, $5, $6::int, $7::int)
			RETURNING id
		`, name, this.userId, gameId, grassShapeId, dreamAddress, ordinanceId, hemisphereId);

		id = town.id;

		await Promise.all([
			createDefaultMap.bind(this)(id, gameId),
		]);

		townUserId = this.userId;
	}

	// Other areas
	await Promise.all([
		updateFruit.bind(this)(id, fruit, nativeTownFruit, islandFruitId1, islandFruitId2), // Fruit
		updateStores.bind(this)(id, stores), // Stores
		updatePublicWorkProjects.bind(this)(id, pwps), // Public Work Projects
		updateResidents.bind(this)(id, residents), // Residents
		updateIsland.bind(this)(id, islandName, islandResidentId, gameId), // AC:GC Island
	]);

	return {
		id: id,
		userId: townUserId,
	};
}

async function validateFruit(gameId, fruit, nativeTownFruit, islandFruitId1, islandFruitId2)
{
	await Promise.all([
		Promise.all([
			fruit.map(async (fruitId) => {
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
			})
		]),
		async function (nativeTownFruit, gameId)
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
		async function (islandFruitId1, gameId)
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
		async function (islandFruitId2, gameId)
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

async function updateFruit(id, fruit, nativeTownFruit, islandFruitId1, islandFruitId2)
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
			fruit.map(async (fruitId) => {
				await db.query(`
					INSERT INTO town_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, fruitId);
			})
		]),
		db.query(`
			INSERT INTO town_native_fruit (town_id, fruit_id)
			VALUES ($1::int, $2::int)
		`, id, nativeTownFruit),
		async function (id, islandFruitId1)
		{
			if (islandFruitId1 > 0)
			{
				await db.query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, id, islandFruitId1);
			}
		}.bind(this)(id, islandFruitId1),
		async function (id, islandFruitId2)
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

async function validateGrassShape(grassShapeId)
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

async function validateOrdinance(ordinanceId)
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

async function validateStores(gameId, stores)
{
	await Promise.all([
		stores.map(async (storeId) => {
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
		})
	]);
}

async function updateStores(id, stores)
{
	await db.query(`
		DELETE FROM town_store
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		stores.map(async (storeId) => {
			await db.query(`
				INSERT INTO town_store (town_id, store_id)
				VALUES ($1::int, $2::int)
			`, id, storeId);
		})
	]);
}

async function validatePublicWorkProjects(gameId, pwps)
{
	if ((gameId != constants.gameIds.ACNL && pwps.length > 0) || pwps.length > 30)
	{
		throw new UserError('too-many-pwps');
	}

	const gamePWPs = getPWPs(gameId);

	pwps.map(pwpId => {
		if (!gamePWPs.find(p => p.id === pwpId))
		{
			throw new UserError('bad-format');
		}
	})
}

async function updatePublicWorkProjects(id, pwps)
{
	await db.query(`
		DELETE FROM town_public_work_project
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		pwps.map(async (pwpId) => {
			await db.query(`
				INSERT INTO town_public_work_project (town_id, pwp_id)
				VALUES ($1::int, $2)
			`, id, pwpId);
		})
	]);
}

async function validateResidents(gameId, islandResidentId, residents)
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

	if (gameId == constants.gameIds.ACGC && islandResidentId > 0)
	{
		residents.push(islandResidentId);
	}

	const gameResidents = sortedResidents[gameId];

	await Promise.all([
		residents.map(async (residentId) => {
			if (!gameResidents.find(r => r.id === residentId))
			{
				throw new UserError('bad-format');
			}
		})
	]);
}

async function updateResidents(id, residents)
{
	await db.query(`
		DELETE FROM town_resident
		WHERE town_id = $1::int
	`, id);

	await Promise.all([
		residents.map(async (residentId) => {
			await db.query(`
				INSERT INTO town_resident (town_id, resident_id)
				VALUES ($1::int, $2)
			`, id, residentId);
		})
	]);
}

async function updateIsland(id, islandName, islandResidentId, gameId)
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

async function validateHemisphere(hemisphereId)
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

async function createDefaultMap(id, gameId)
{
	if (gameId === constants.gameIds.ACNH)
	{
		// don't default a map for NH
		return;
	}

	const acres = utils.getDefaultMapAcres(gameId);

	await this.query('v1/town/map/save', {townId: id, acres: acres});
}

save.apiTypes = {
	gameId: {
		type: APITypes.acgameId,
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
		default: 0,
	},
	dreamAddress: {
		type: APITypes.string,
		default: '',
	},
	ordinanceId: {
		type: APITypes.number,
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
}

export default save;