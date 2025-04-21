import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, townId, name, bells, debt, houseSizeIds, hraScore,
	bedLocationId, faceId, nookMiles, happyHomeNetworkId, creatorId, paintId, monumentId }: saveProps): Promise<{ id: number, userId: number }>
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
		validateHouseSizes(townId, houseSizeIds), // House Sizes
		validateBedLocation(townId, bedLocationId), // AC:GC/AC:WW Bed Location
		validateFace(townId, faceId), // Face (AC:GC through AC:NL only)
		validatePaint(townId, paintId), // AC:GC and AC:CF Roof Paint
		validateMonument(townId, monumentId), // AC:GC Train Station Monument
	]);

	// Perform queries
	const townUserId = await db.transaction(async (query: any) =>
	{
		let townUserId;

		if (id > 0)
		{
			const [character] = await query(`
				SELECT town.id AS town_id, town.user_id, town.game_id, ac_game.max_characters
				FROM character
				JOIN town ON (town.id = character.town_id)
				JOIN ac_game ON (town.game_id = ac_game.id)
				WHERE character.id = $1::int
			`, id);

			if (character.user_id !== this.userId)
			{
				throw new UserError('permission');
			}

			await Promise.all([
				validateHappyHomeNetworkId(character.game_id, happyHomeNetworkId),
				validateCreatorId(character.game_id, creatorId),
			]);

			townUserId = character.user_id;

			await query(`
				UPDATE character
				SET name = $2, bells = $3, debt = $4, hra_score = $5, face_id = $6::int, bed_location_id = $7::int, nook_miles = $8::int, happy_home_network_id = $9, creator_id = $10, paint_id = $11, monument_id = $12
				WHERE character.id = $1::int
			`, id, name, bells, debt, hraScore, faceId, bedLocationId, nookMiles, happyHomeNetworkId, creatorId, paintId, monumentId);
		}
		else
		{
			const [foundTown] = await query(`
				SELECT town.user_id, town.game_id, ac_game.max_characters
				FROM town
				JOIN ac_game ON (town.game_id = ac_game.id)
				WHERE town.id = $1::int
			`, townId);

			if (foundTown.user_id !== this.userId)
			{
				throw new UserError('permission');
			}

			const [characters] = await query(`
				SELECT count(*) AS count
				FROM character
				WHERE town_id = $1::int
			`, townId);

			if (Number(characters.count) + 1 > foundTown.max_characters)
			{
				throw new UserError('too-many-characters');
			}

			await Promise.all([
				validateHappyHomeNetworkId(foundTown.game_id, happyHomeNetworkId),
				validateCreatorId(foundTown.game_id, creatorId),
			]);

			const [townCharacters] = await query(`
				SELECT count(*) AS count
				FROM character
				JOIN town ON (town.id = character.town_id)
				WHERE town.user_id = $1
			`, this.userId);

			if (townCharacters.count >= constants.max.towns * 8)
			{
				throw new UserError('too-many-town-characters');
			}

			const [newCharacter] = await query(`
				INSERT INTO character (name, town_id, bells, debt, hra_score, face_id, bed_location_id, nook_miles, happy_home_network_id, creator_id, paint_id, monument_id)
				VALUES ($1, $2::int, $3, $4, $5, $6::int, $7::int, $8::int, $9, $10, $11, $12)
				RETURNING id
			`, name, townId, bells, debt, hraScore, faceId, bedLocationId, nookMiles, happyHomeNetworkId, creatorId, paintId, monumentId);

			id = newCharacter.id;

			townUserId = this.userId;
		}

		// Other areas
		await Promise.all([
			updateHouseSizes(Number(id || 0), houseSizeIds, query), // House Sizes
		]);

		return townUserId;
	});

	return {
		id: id,
		userId: townUserId,
	};
}

export async function validateHouseSizes(townId: number, houseSizeIds: any[]): Promise<void>
{
	await Promise.all(
		houseSizeIds.map(async (houseSizeId) =>
		{
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
		}),
	);
}

export async function validateBedLocation(townId: number, bedLocationId: number | null): Promise<void>
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

export async function validateFace(townId: number, faceId: number | null): Promise<void>
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

export async function validateHappyHomeNetworkId(gameId: number, happyHomeNetworkId: string): Promise<void>
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

export async function validateCreatorId(gameId: number, creatorId: string): Promise<void>
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

export async function updateHouseSizes(id: number, houseSizeIds: any[], query: any): Promise<void>
{
	query(`
		DELETE FROM character_house_size
		WHERE character_id = $1::int
	`, id);

	await Promise.all(
		houseSizeIds.map(async (houseSizeId) =>
		{
			if (houseSizeId > 0)
			{
				await query(`
					INSERT INTO character_house_size (character_id, house_size_id)
					VALUES ($1::int, $2::int)
				`, id, houseSizeId);
			}
		}),
	);
}

export async function validatePaint(townId: number, paintId: number | null): Promise<void>
{
	if (paintId === null)
	{
		return;
	}

	const [paint] = await db.query(`
		SELECT ac_game_paint.id
		FROM town
		JOIN ac_game_paint ON (ac_game_paint.game_id = town.game_id)
		WHERE ac_game_paint.id = $1::int AND town.id = $2::int
	`, paintId, townId);

	if (!paint)
	{
		throw new UserError('bad-format');
	}
}

export async function validateMonument(townId: number, monumentId: number | null): Promise<void>
{
	if (monumentId === null)
	{
		return;
	}

	const [monument] = await db.query(`
		SELECT monument.id
		FROM town
		JOIN ac_game_monument ON (ac_game_monument.game_id = town.game_id)
		JOIN monument ON (ac_game_monument.monument_id = monument.id)
		WHERE monument.id = $1::int AND town.id = $2::int
	`, monumentId, townId);

	if (!monument)
	{
		throw new UserError('bad-format');
	}
}

save.apiTypes = {
	id: {
		type: APITypes.characterId,
		nullable: true,
	},
	townId: {
		type: APITypes.townId,
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
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
	paintId: {
		type: APITypes.number,
		nullable: true,
	},
	monumentId: {
		type: APITypes.number,
		nullable: true,
	},
};

type saveProps = {
	id: number
	townId: number
	name: string
	bells: number
	nookMiles: number
	debt: number
	houseSizeIds: any[]
	hraScore: number
	bedLocationId: number | null
	faceId: number | null
	happyHomeNetworkId: string
	creatorId: string
	paintId: number | null
	monumentId: number | null
};

export default save;
