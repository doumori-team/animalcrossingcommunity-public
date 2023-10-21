import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function save({id, townId, name, bells, debt, houseSizeIds, hraScore,
	bedLocationId, faceId, nookMiles, happyHomeNetworkId, creatorId})
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
	houseSizeIds = houseSizeIds.map((id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('bad-format');
		}

		return Number(id);
	});

	happyHomeNetworkId = happyHomeNetworkId.toUpperCase();

	// Other area validations
	await Promise.all([
		validateHouseSizes.bind(this)(townId, houseSizeIds), // House Sizes
		validateBedLocation.bind(this)(townId, bedLocationId), // Bed Location
		validateFace.bind(this)(townId, faceId), // Face
	]);

	// Perform queries
	const townUserId = await db.transaction(async query =>
	{
		let townUserId;

		if (id > 0)
		{
			let [character] = await query(`
				SELECT town.user_id, town.game_id
				FROM character
				JOIN town ON (town.id = character.town_id)
				WHERE character.id = $1::int
			`, id);

			if (!character)
			{
				throw new UserError('no-such-character');
			}

			await Promise.all([
				validateHappyHomeNetworkId.bind(this)(character.game_id, happyHomeNetworkId),
				validateCreatorId.bind(this)(character.game_id, creatorId),
			]);

			if (character.user_id != this.userId)
			{
				throw new UserError('permission');
			}

			townUserId = character.user_id;

			await query(`
				UPDATE character
				SET name = $2, bells = $3, debt = $4, hra_score = $5, face_id = $6::int, bed_location_id = $7::int, nook_miles = $8::int, happy_home_network_id = $9, creator_id = $10
				WHERE character.id = $1::int
			`, id, name, bells, debt, hraScore, faceId, bedLocationId, nookMiles, happyHomeNetworkId, creatorId);
		}
		else
		{
			const user = await this.query('v1/user_lite', {id: this.userId});

			if (typeof(user) === 'undefined' || user.length === 0)
			{
				throw new UserError('no-such-user');
			}

			let [foundTownId] = await query(`
				SELECT game_id
				FROM town
				WHERE id = $1::int
			`, townId);

			if (!foundTownId)
			{
				throw new UserError('no-such-town');
			}

			await Promise.all([
				validateHappyHomeNetworkId.bind(this)(foundTownId.game_id, happyHomeNetworkId),
			]);

			[id] = await query(`
				INSERT INTO character (name, town_id, bells, debt, hra_score, face_id, bed_location_id, nook_miles, happy_home_network_id)
				VALUES ($1, $2::int, $3, $4, $5, $6::int, $7::int, $8::int, $9)
				RETURNING id
			`, name, townId, bells, debt, hraScore, faceId, bedLocationId, nookMiles, happyHomeNetworkId);

			id = id.id;

			townUserId = this.userId;
		}

		// Other areas
		await Promise.all([
			updateHouseSizes.bind(this)(id, houseSizeIds, query), // House Sizes
		]);

		return townUserId;
	});

	return {
		id: id,
		userId: townUserId,
	};
}

async function validateHouseSizes(townId, houseSizeIds)
{
	await Promise.all([
		houseSizeIds.map(async (houseSizeId) => {
			if (houseSizeId > 0)
			{
				const [houseSize] = await db.query(`
					SELECT house_size.id
					FROM town
					JOIN ac_game_house_size ON (ac_game_house_size.game_id = town.game_id)
					JOIN house_size ON (ac_game_house_size.house_size_id = house_size.id)
					WHERE town.id = $2::int AND house_size.id = $1::int
				`, houseSizeId, townId);

				if (!houseSize)
				{
					throw new UserError('bad-format');
				}
			}
		})
	]);
}

async function validateBedLocation(townId, bedLocationId)
{
	if (bedLocationId === null)
	{
		return;
	}

	const [bedLocation] = await db.query(`
		SELECT bed_location.id
		FROM town
		JOIN ac_game_bed_location ON (ac_game_bed_location.game_id = town.game_id)
		JOIN bed_location ON (ac_game_bed_location.bed_location_id = bed_location.id)
		WHERE bed_location.id = $1::int AND town.id = $2::int
	`, bedLocationId, townId);

	if (!bedLocation)
	{
		throw new UserError('bad-format');
	}
}

async function validateFace(townId, faceId)
{
	if (faceId === null)
	{
		return;
	}

	const [face] = await db.query(`
		SELECT ac_game_face.face_id
		FROM town
		JOIN ac_game_face ON (ac_game_face.game_id = town.game_id)
		WHERE ac_game_face.face_id = $1::int AND town.id = $2::int
	`, faceId, townId);

	if (!face)
	{
		throw new UserError('bad-format');
	}
}

async function validateHappyHomeNetworkId(gameId, happyHomeNetworkId)
{
	if (utils.realStringLength(happyHomeNetworkId) === 0)
	{
		return;
	}

	if (gameId !== constants.gameIds.ACNH)
	{
		throw new UserError('bad-format');
	}
}

async function validateCreatorId(gameId, creatorId)
{
	if (utils.realStringLength(creatorId) === 0)
	{
		return;
	}

	if (gameId !== constants.gameIds.ACNH)
	{
		throw new UserError('bad-format');
	}
}

async function updateHouseSizes(id, houseSizeIds, query)
{
	query(`
		DELETE FROM character_house_size
		WHERE character_id = $1::int
	`, id);

	await Promise.all([
		houseSizeIds.map(async (houseSizeId) => {
			if (houseSizeId > 0)
			{
				await query(`
					INSERT INTO character_house_size (character_id, house_size_id)
					VALUES ($1::int, $2::int)
				`, id, houseSizeId);
			}
		})
	]);
}

save.apiTypes = {
	id: {
		type: APITypes.characterId,
		nullable: true,
	},
	townId: {
		type: APITypes.townId,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-character-name',
		length: constants.max.keyboardName,
		profanity: true,
	},
	bells: {
		type: APITypes.wholeNumber,
		default: 0,
		max: constants.max.number,
	},
	nookMiles: {
		type: APITypes.wholeNumber,
		default: 0,
		max: constants.max.number,
	},
	debt: {
		type: APITypes.wholeNumber,
		default: 0,
		max: constants.max.number,
	},
	houseSizeIds: {
		type: APITypes.array,
	},
	hraScore: {
		type: APITypes.wholeNumber,
		default: 0,
		max: constants.max.number,
	},
	bedLocationId: {
		type: APITypes.number,
		nullable: true,
	},
	faceId: {
		type: APITypes.number,
		nullable: true,
	},
	happyHomeNetworkId: {
		type: APITypes.regex,
		regex: constants.regexes.happyHomeNetworkId,
	},
	creatorId: {
		type: APITypes.regex,
		regex: constants.regexes.creatorId,
	},
}

export default save;