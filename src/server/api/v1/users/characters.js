import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function characters({id})
{
	const [viewUserCatalog, useTradingPostPerm, viewTowns, useFriendCodes] = await Promise.all([
		this.query('v1/permission', {permission: 'view-user-catalog'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'view-towns'}),
		this.query('v1/permission', {permission: 'use-friend-codes'}),
	]);

	if (!(viewUserCatalog || useTradingPostPerm || viewTowns || useFriendCodes))
	{
		throw new UserError('permission');
	}

	const characters = await db.query(`
		SELECT
			character.id
		FROM character
		JOIN town ON (character.town_id = town.id)
		WHERE town.user_id = $1::int
	`, id);

	return await Promise.all(characters.map(async(character) => {
		return this.query('v1/character', {id: character.id})
	}));
}

characters.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
}

export default characters;