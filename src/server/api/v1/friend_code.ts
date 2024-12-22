import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, FriendCodeType, UserLiteType } from '@types';

async function friend_code(this: APIThisType, { id }: friendCodeProps): Promise<FriendCodeType | null>
{
	const [useFriendCodesPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', { permission: 'use-friend-codes' }),
		this.query('v1/permission', { permission: 'use-trading-post' }),
	]);

	if (!(useFriendCodesPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	const [friendCode] = await db.query(`
		SELECT
			friend_code.id,
			friend_code.user_id,
			friend_code.friend_code AS code,
			game.id AS game_id,
			game.name,
			game.pattern,
			game.placeholder,
			character.id AS character_id,
			character.name AS character_name,
			town.name AS town_name,
			town.id AS town_id,
			ac_game_game.acgame_id
		FROM friend_code
		JOIN game ON (game.id = friend_code.game_id)
		JOIN game_console ON (game_console.id = game.game_console_id)
		LEFT JOIN ac_game_game ON (game.id = ac_game_game.game_id)
		LEFT JOIN friend_code_character ON (friend_code_character.friend_code_id = friend_code.id)
		LEFT JOIN character ON (friend_code_character.character_id = character.id)
		LEFT JOIN town ON (character.town_id = town.id)
		WHERE friend_code.id = $1::int AND game_console.is_enabled AND game.is_enabled
		ORDER BY game_console.is_legacy NULLS FIRST, game_console.sequence, game.sequence, game.name, friend_code.id
	`, id);

	if (!friendCode)
	{
		throw new UserError('no-such-friend-code');
	}

	// confirm logged-in user can view friend codes of this user
	if (this.userId !== friendCode.user_id)
	{
		const [whitelist] = await db.query(`
			SELECT
				id
			FROM friend_code_whitelist
			WHERE user_id = $1::int AND whitelist_user_id = $2::int
		`, friendCode.user_id, this.userId);

		if (!whitelist)
		{
			return null;
		}
		else
		{
			// if you haven't whitelisted each other, confirm you have
			// whitelisted for rating
			const [otherWhitelist] = await db.query(`
				SELECT
					id
				FROM friend_code_whitelist
				WHERE user_id = $1::int AND whitelist_user_id = $2::int
			`, this.userId, friendCode.user_id);

			if (!otherWhitelist)
			{
				const [ratingWhitelist] = await db.query(`
					SELECT
						id
					FROM wifi_rating_whitelist
					WHERE user_id = $1::int AND whitelist_user_id = $2::int
				`, this.userId, friendCode.user_id);

				if (!ratingWhitelist)
				{
					return null;
				}
			}
		}
	}

	const user: UserLiteType = await this.query('v1/user_lite', { id: friendCode.user_id });

	// Create return object
	let character: any = null;

	if (friendCode.character_id > 0)
	{
		character = {
			id: friendCode.character_id,
			name: friendCode.character_name,
			town: {
				id: friendCode.town_id,
				name: friendCode.town_name,
			},
			game: {
				id: friendCode.game_id,
			},
		};
	}

	return <FriendCodeType>{
		id: friendCode.id,
		userId: friendCode.user_id,
		code: friendCode.code,
		game: {
			id: friendCode.game_id,
			acGameId: friendCode.acgame_id,
		},
		name: friendCode.name,
		pattern: friendCode.pattern,
		placeholder: friendCode.placeholder,
		character: character,
		username: user.username,
	};
}

friend_code.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type friendCodeProps = {
	id: number
};

export default friend_code;
