import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, CharacterType } from '@types';

async function character(this: APIThisType, {id}: characterProps) : Promise<CharacterType>
{
	const [viewTownsPerm, useFriendCodesPerm, viewUserCatalogPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-towns'}),
		this.query('v1/permission', {permission: 'use-friend-codes'}),
		this.query('v1/permission', {permission: 'view-user-catalog'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(viewTownsPerm || useFriendCodesPerm || viewUserCatalogPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	const [character] = await db.query(`
		SELECT
			character.id,
			character.name,
			town.id AS town_id,
			town.name AS town_name,
			ac_game.id AS game_id,
			ac_game.shortname AS ac_game,
			character.bells,
			character.debt,
			character.hra_score,
			character.bed_location_id,
			bed_location.filename AS bed_location_filename,
			character.face_id,
			face.filename AS face_filename,
			town.user_id,
			character.nook_miles,
			character.happy_home_network_id,
			character.creator_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		JOIN ac_game ON (town.game_id = ac_game.id)
		LEFT JOIN bed_location ON (character.bed_location_id = bed_location.id)
		LEFT JOIN face ON (character.face_id = face.id)
		WHERE character.id = $1::int
	`, id);

	if (!character)
	{
		throw new UserError('no-such-character');
	}

	const [houseSizes, catalogTotal, museumTotal] = await Promise.all([
		getHouseSizes.bind(this)(character.id),
		getCatalogTotal.bind(this)(character.id),
		getMuseumTotal.bind(this)(character.id),
	]);

	return <CharacterType>{
		id: character.id,
		name: character.name,
		town: {
			id: character.town_id,
			name: character.town_name,
			game: {
				id: character.game_id,
				shortname: character.ac_game,
			}
		},
		game: {
			id: character.game_id,
			shortname: character.ac_game,
			identifier: character.ac_game.replace(':', '').toLowerCase(),
		},
		bells: character.bells,
		debt: character.debt,
		hraScore: character.hra_score,
		bedLocation: {
			id: character.bed_location_id,
			filename: character.bed_location_filename,
		},
		face: {
			id: character.face_id,
			filename: character.face_filename,
		},
		userId: character.user_id,
		houseSizes: houseSizes,
		nookMiles: character.nook_miles,
		catalogTotal: catalogTotal,
		happyHomeNetworkId: character.happy_home_network_id,
		creatorId: character.creator_id,
		museumTotal: museumTotal,
	};
}

async function getHouseSizes(id: number) : Promise<CharacterType['houseSizes']>
{
	let houseSizes = await db.query(`
		SELECT
			house_size.id,
			house_size.name,
			house_size.group_id
		FROM house_size
		JOIN character_house_size ON (character_house_size.house_size_id = house_size.id)
		WHERE character_house_size.character_id = $1::int
	`, id);

	return houseSizes.map((houseSize:any) => {
		return {
			id: houseSize.id,
			name: houseSize.name,
			groupId: houseSize.group_id,
		};
	});
}

async function getCatalogTotal(id: number) : Promise<number>
{
	const [count] = await db.query(`
		SELECT
			count(*) AS count
		FROM catalog_item
		WHERE catalog_item.character_id = $1::int AND catalog_item.is_inventory = true
	`, id);

	return Number(count.count);
}

async function getMuseumTotal(id: number) : Promise<number>
{
	const [count] = await db.query(`
		SELECT count(*) AS count
		FROM catalog_item
		WHERE catalog_item.character_id = $1::int AND catalog_item.in_museum = true
	`, id);

	return Number(count.count);
}

character.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type characterProps = {
	id: number
}

export default character;