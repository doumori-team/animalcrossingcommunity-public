import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import { faker } from '@faker-js/faker/locale/en';
import { residents as sortedResidents } from '@/catalog/residents.js';
import { getPWPs } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';

/*
 * Create basic town, character and FC (if possible)
 */

async function town({gameId, userId})
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters

	userId = userId || this.userId;

	// Perform queries

	// get info
	const [grassShapeIds, ordinanceIds, hemisphereIds, fruitIds, nativeFruitIds,
		nookStoreIds, islandFruit1Ids, islandFruit2Ids, storeIds, [maxResidents],
		houseSizes, tuneIds, [fcGame]] = await Promise.all([
		db.query(`
			SELECT grass_shape.id
			FROM grass_shape
		`),
		db.query(`
			SELECT ordinance.id
			FROM ordinance
		`),
		db.query(`
			SELECT hemisphere.id
			FROM hemisphere
		`),
		db.query(`
			SELECT fruit.id
			FROM fruit
			JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $1::int)
			WHERE ac_game_fruit.fruit_group = 'regular'
		`, gameId),
		db.query(`
			SELECT fruit.id
			FROM fruit
			JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $1::int)
			WHERE ac_game_fruit.fruit_group = 'regular'
		`, gameId),
		db.query(`
			SELECT store.id
			FROM store
			JOIN ac_game_store ON (ac_game_store.store_id = store.id AND ac_game_store.game_id = $1::int)
			WHERE store.store_group = 'nook'
		`, gameId),
		db.query(`
			SELECT fruit.id
			FROM fruit
			JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $1::int)
			WHERE ac_game_fruit.fruit_group = 'island_1'
		`, gameId),
		db.query(`
			SELECT fruit.id
			FROM fruit
			JOIN ac_game_fruit ON (ac_game_fruit.fruit_id = fruit.id AND ac_game_fruit.game_id = $1::int)
			WHERE ac_game_fruit.fruit_group = 'island_2'
		`, gameId),
		db.query(`
			SELECT store.id
			FROM store
			JOIN ac_game_store ON (ac_game_store.store_id = store.id AND ac_game_store.game_id = $1::int)
			WHERE store.store_group = 'other'
		`, gameId),
		db.query(`
			SELECT max_residents
			FROM ac_game
			WHERE ac_game.id = $1::int
		`, gameId),
		db.query(`
			SELECT
				house_size_group.id,
				house_size_group.name
			FROM house_size
			JOIN ac_game_house_size ON (house_size.id = ac_game_house_size.house_size_id AND ac_game_house_size.game_id = $1::int)
			JOIN house_size_group ON (house_size.group_id = house_size_group.id)
			GROUP BY house_size_group.id
			ORDER BY house_size_group.id ASC
		`, gameId),
		db.query(`
			SELECT id, notes, creator_id, name
			FROM town_tune
			LIMIT 200
		`),
		db.query(`
			SELECT game_id AS id
			FROM ac_game_game
			WHERE acgame_id = $1::int
		`, gameId),
	]);

	// Town

	const town = await db.transaction(async query =>
	{
		const townName = faker.address.cityName();
		const grassShapeId = faker.helpers.arrayElement(grassShapeIds).id;

		let dreamAddress = null;

		if ([constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId))
		{
			dreamAddress = `${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}`;
		}

		if (gameId === constants.gameIds.ACNH)
		{
			dreamAddress = `DA-${dreamAddress}`;
		}

		const ordinanceId = [constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) ? faker.helpers.arrayElement(ordinanceIds).id : null;
		const hemisphereId = [constants.gameIds.ACNH].includes(gameId) ? faker.helpers.arrayElement(hemisphereIds).id : null;

		const [town] = await query(`
			INSERT INTO town (name, user_id, game_id, grass_shape_id, dream_address, ordinance_id, hemisphere_id)
			VALUES ($1, $2::int, $3::int, $4::int, $5, $6::int, $7::int)
			RETURNING id
		`, townName, userId, gameId, grassShapeId, dreamAddress, ordinanceId, hemisphereId);

		const nativeFruitId = faker.helpers.arrayElement(nativeFruitIds).id;

		const fruit = faker.helpers.arrayElements(fruitIds);

		const nookStoreId = faker.helpers.arrayElement(nookStoreIds).id;

		const residentIds = sortedResidents[gameId].filter(r => r.isTown === true);

		const residents = faker.helpers.arrayElements(residentIds, maxResidents.max_residents);

		await Promise.all([
			Promise.all([
				fruit.map(async (fruit) => {
					await query(`
						INSERT INTO town_fruit (town_id, fruit_id)
						VALUES ($1::int, $2::int)
					`, town.id, fruit.id);
				})
			]),
			query(`
				INSERT INTO town_native_fruit (town_id, fruit_id)
				VALUES ($1::int, $2::int)
			`, town.id, nativeFruitId),
			query(`
				INSERT INTO town_store (town_id, store_id)
				VALUES ($1::int, $2::int)
			`, town.id, nookStoreId),
			Promise.all([
				residents.map(async (resident) => {
					await query(`
						INSERT INTO town_resident (town_id, resident_id)
						VALUES ($1::int, $2)
					`, town.id, resident.id);
				})
			]),
		]);

		if (gameId === constants.gameIds.ACNL)
		{
			const islandFruitId1 = faker.helpers.arrayElement(islandFruit1Ids).id;
			const islandFruitId2 = faker.helpers.arrayElement(islandFruit2Ids).id;

			const pwpIds = getPWPs(constants.gameIds.ACNL);
			const pwps = faker.helpers.arrayElements(pwpIds, 30);

			const stores = faker.helpers.arrayElements(storeIds, 5);

			await Promise.all([
				Promise.all([
					pwps.map(async (pwp) => {
						await query(`
							INSERT INTO town_public_work_project (town_id, pwp_id)
							VALUES ($1::int, $2::int)
						`, town.id, pwp.id);
					})
				]),
				query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, town.id, islandFruitId1),
				query(`
					INSERT INTO town_native_fruit (town_id, fruit_id)
					VALUES ($1::int, $2::int)
				`, town.id, islandFruitId2),
				Promise.all([
					stores.map(async (store) => {
						await query(`
							INSERT INTO town_store (town_id, store_id)
							VALUES ($1::int, $2::int)
						`, town.id, store.id);
					})
				]),
			]);
		}

		if (gameId === constants.gameIds.ACGC)
		{
			const islandName = faker.address.country();
			const islandResidentIds = sortedResidents[gameId].filter(r => r.isIsland === true);
			const islandResidentId = faker.helpers.arrayElement(islandResidentIds).id;

			await query(`
				INSERT INTO island (name, town_id, resident_id)
				VALUES ($1, $2::int, $3)
			`, islandName, town.id, islandResidentId);
		}

		let acres = utils.getDefaultMapAcres(gameId);

		if (acres !== null)
		{
			acres = acres.map(id => {
				return Number(id).toString(16).padStart(4, '0');
			});

			await query(`
				UPDATE town
				SET map_tiles = $2
				WHERE id = $1::int
			`, town.id, acres.join(''));
		}

		if (tuneIds.length > 0)
		{
			const tune = faker.helpers.arrayElement(tuneIds);

			await query(`
				UPDATE town
				SET town_tune_id = $1::int, town_tune_notes = $3, town_tune_creator_id = $4, town_tune_name = $5
				WHERE id = $2::int
			`, tune.id, town.id, tune.notes, tune.creator_id, tune.name);
		}
		else
		{
			await this.query('v1/automation/content/tunes', {amount: 1});

			await query(`
				UPDATE town
				SET town_tune_notes = (SELECT notes FROM town_tune LIMIT 1), town_tune_creator_id = (SELECT creator_id FROM town_tune LIMIT 1), town_tune_name = (SELECT name FROM town_tune LIMIT 1)
				WHERE id = $1::int
			`, town.id);
		}

		return town;
	});

	// Character

	const character = await db.transaction(async query =>
	{
		const characterName = faker.name.firstName();
		const bells = faker.random.numeric(5);
		const debt = faker.random.numeric(5);
		const hraScore = faker.random.numeric(5);

		let faceId = null, bedLocationId = null, nookMiles = null, happyHomeNetworkId = null;

		if (gameId === constants.gameIds.ACGC)
		{
			const [faceIds, bedLocationIds] = await Promise.all([
				query(`
					SELECT ac_game_face.face_id AS id
					FROM town
					JOIN ac_game_face ON (ac_game_face.game_id = town.game_id)
					WHERE town.id = $1::int
				`, town.id),
				query(`
					SELECT bed_location.id
					FROM town
					JOIN ac_game_bed_location ON (ac_game_bed_location.game_id = town.game_id)
					JOIN bed_location ON (ac_game_bed_location.bed_location_id = bed_location.id)
					WHERE town.id = $1::int
				`, town.id),
			]);

			faceId = faker.helpers.arrayElement(faceIds).id;

			bedLocationId = faker.helpers.arrayElement(bedLocationIds).id;
		}
		else if (gameId === constants.gameIds.ACNH)
		{
			nookMiles = faker.random.numeric(3);

			happyHomeNetworkId = `RA-${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}`;
		}

		const [character] = await query(`
			INSERT INTO character (name, town_id, bells, debt, hra_score, face_id, bed_location_id, nook_miles, happy_home_network_id)
			VALUES ($1, $2::int, $3, $4, $5, $6::int, $7::int, $8::int, $9)
			RETURNING id
		`, characterName, town.id, bells, debt, hraScore, faceId, bedLocationId, nookMiles, happyHomeNetworkId);

		await Promise.all(houseSizes.map(async (houseSizeObj) =>
		{
			const houseSizeIds = await query(`
				SELECT
					house_size.id,
					house_size.name
				FROM house_size
				JOIN ac_game_house_size ON (house_size.id = ac_game_house_size.house_size_id AND ac_game_house_size.game_id = $1::int)
				WHERE house_size.group_id = $2::int
				ORDER BY house_size.id ASC
			`, gameId, houseSizeObj.id);

			const houseSizeId = faker.helpers.arrayElement(houseSizeIds).id;

			await query(`
				INSERT INTO character_house_size (character_id, house_size_id)
				VALUES ($1::int, $2::int)
			`, character.id, houseSizeId);
		}));

		return character;
	});

	// FC

	if (gameId !== constants.gameIds.ACGC)
	{
		await db.transaction(async query =>
		{
			let code = `${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}-${faker.random.alphaNumeric(4)}`;

			if (gameId === constants.gameIds.ACNH)
			{
				code = `SW-${code}`;
			}

			const [friendCode] = await query(`
				INSERT INTO friend_code (user_id, game_id, friend_code)
				VALUES ($1::int, $2::int, $3::text)
				RETURNING id
			`, userId, fcGame.id, code);

			await query(`
				INSERT INTO friend_code_character (friend_code_id, character_id)
				VALUES ($1::int, $2::int)
			`, friendCode.id, character.id);
		});
	}

	return {
		_success: `Your town has been created!`
	};
}

town.apiTypes = {
	gameId: {
		type: APITypes.acgameId,
	},
	userId: {
		type: APITypes.number,
		nullable: true,
	},
}

export default town;