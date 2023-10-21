import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function save({id, gameId, code, characterId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	let [game] = await db.query(`
		SELECT pattern
		FROM game
		WHERE id = $1::int
	`, gameId);

	if (!code.match(RegExp(game.pattern)))
	{
		throw new UserError('bad-format');
	}

	if (characterId > 0)
	{
		// Check characterId param
		let [checkCharacterId] = await db.query(`
			SELECT town.game_id, town.user_id
			FROM character
			JOIN town ON (character.town_id = town.id)
			WHERE character.id = $1::int
		`, characterId);

		if (!checkCharacterId)
		{
			throw new UserError('no-such-character');
		}

		// Check if it's a game that should have a character
		let [acGame] = await db.query(`
			SELECT acgame_id
			FROM ac_game_game
			WHERE game_id = $1::int
		`, gameId);

		// Confirm that the character matches the game's ac game
		if (checkCharacterId.game_id !== acGame.acgame_id)
		{
			throw new UserError('bad-format');
		}

		// Confirm that the character is for the same user as the friend code
		let checkUserId = this.userId;

		if (id > 0)
		{
			let [friendCode] = await db.query(`
				SELECT user_id
				FROM friend_code
				WHERE id = $1::int
			`, id);

			checkUserId = friendCode.user_id;
		}

		if (checkCharacterId.user_id !== checkUserId)
		{
			throw new UserError('bad-format');
		}
	}

	// Perform queries
	const friendCodeUserId  = await db.transaction(async query =>
	{
		let friendCodeUserId;

		if (id > 0)
		{
			let [friendCode2] = await query(`
				SELECT user_id
				FROM friend_code
				WHERE id = $1::int
			`, id);

			if (!friendCode2)
			{
				throw new UserError('no-such-friend-code');
			}

			if (friendCode2.user_id != this.userId)
			{
				throw new UserError('permission');
			}

			await query(`
				UPDATE friend_code
				SET friend_code = $2::text
				WHERE id = $1::int
			`, id, code);

			friendCodeUserId = friendCode2.user_id;
		}
		else
		{
			const user = await this.query('v1/user_lite', {id: this.userId});

			if (typeof(user) === 'undefined' || user.length === 0)
			{
				throw new UserError('no-such-user');
			}

			[id] = await query(`
				INSERT INTO friend_code (user_id, game_id, friend_code)
				VALUES ($1::int, $2::int, $3::text)
				RETURNING id
			`, this.userId, gameId, code);

			id = id.id;

			friendCodeUserId = this.userId;
		}

		if (characterId > 0)
		{
			const [listings] = await Promise.all([
				query(`
					SELECT id
					FROM listing_offer
					WHERE character_id = $1::int AND friend_code IS NOT NULL
				`, characterId),
				// Add the character to that friend code
				query(`
					DELETE FROM friend_code_character
					WHERE friend_code_id = $1::int
				`, id),
				query(`
					INSERT INTO friend_code_character (friend_code_id, character_id)
					VALUES ($1::int, $2::int)
				`, id, characterId),
			]);

			// If character used in trade, update that friend code
			await Promise.all([
				listings.map(async(listing) => {
					await query(`
						UPDATE listing_offer
						SET friend_code = $2
						WHERE id = $1::int
					`, listing.id, code);
				})
			]);
		}

		return friendCodeUserId;
	});

	return {
		id: id,
		userId: friendCodeUserId,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	code: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	gameId: {
		type: APITypes.gameId,
	},
	characterId: {
		type: APITypes.characterId,
		nullable: true,
	},
}

export default save;