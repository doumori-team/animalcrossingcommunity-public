import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, gameConsoleId, name, shortName, pattern, placeholder, sequence, isEnabled }: saveProps): Promise<{ id: number }>
{
	const permission: boolean = await this.query('v1/permission', { permission: 'games-admin' });

	if (!permission)
	{
		throw new UserError('permission');
	}

	// Check parameters
	try
	{
		if (!placeholder.match(new RegExp(pattern)))
		{
			throw new UserError('bad-format');
		}
	}
	catch
	{
		throw new UserError('bad-format');
	}

	if (sequence === 0)
	{
		sequence = null;
	}
	else if (sequence && sequence < 0)
	{
		throw new UserError('bad-format');
	}

	// Save information
	const result = await db.transaction(async (query: any) =>
	{
		if (id != null && id > 0)
		{
			const [previousGameInfo] = await query(`
				SELECT
					game_console_id,
					sequence
				FROM game
				WHERE game.id = $1::int
			`, id);

			if (!previousGameInfo)
			{
				throw new UserError('no-such-game');
			}

			if (previousGameInfo.game_console_id !== gameConsoleId)
			{
				// Resets sequence if this game is changed from game console
				sequence = null;
			}

			// Alter sequence for elements that have shifted positions due to sequence change
			if (!previousGameInfo.sequence && sequence)
			{
				// Modified game's sequence has been added

				// Obtain last number in sequence for comparison purposes
				const [lastInSequence] = await query(`
					SELECT MAX(sequence)
					FROM game
					WHERE game_console_id = $1::int
				`, gameConsoleId);

				if (lastInSequence.max + 1 < sequence)
				{
					throw new UserError('no-such-game');
				}

				await query(`
					UPDATE game
					SET sequence = sequence + 1
					WHERE game_console_id = $1::int AND $2::int <= sequence
				`, gameConsoleId, sequence);
			}
			else if (previousGameInfo.sequence && !sequence)
			{
				// Modified game's sequence has been removed
				// Or this game had a sequence and was moved to another console
				await query(`
					UPDATE game
					SET sequence = sequence - 1
					WHERE game.game_console_id = $1::int AND $2::int < sequence
				`, previousGameInfo.game_console_id, previousGameInfo.sequence);
			}
			else if (sequence != null && previousGameInfo.sequence > sequence)
			{
				// Modified game went up the list;
				// all games in between have been shifted one position downwards.
				await query(`
					UPDATE game
					SET
						game_console_id = $2::int,
						name = $3,
						short_name = $4,
						pattern = $5,
						placeholder = $6,
						sequence = $7,
						is_enabled = $8::bool
					WHERE game.id = $1::int
					RETURNING id
				`, id, gameConsoleId, name, shortName, pattern, placeholder, sequence, isEnabled);
			}
			else if (sequence != null && previousGameInfo.sequence < sequence)
			{
				// Obtain last number in sequence for comparison purposes
				const [lastInSequence] = await query(`
					SELECT MAX(sequence)
					FROM game
					WHERE game.game_console_id = $1::int
				`, gameConsoleId);

				if (lastInSequence.max < sequence)
				{
					// Input sequence is greater than list size plus the new game
					throw new UserError('bad-format');
				}

				// Modified game went lower down the list;
				// all games in between have shifted one position upwards.
				await query(`
					UPDATE game
					SET sequence = sequence - 1
					WHERE game.game_console_id = $1::int AND sequence BETWEEN $2::int AND $3::int
				`, gameConsoleId, previousGameInfo.sequence, sequence);
			}

			return await query(`
				UPDATE game
				SET
					game_console_id = $2::int,
					name = $3,
					short_name = $4,
					pattern = $5,
					placeholder = $6,
					sequence = $7,
					is_enabled = $8::bool
				WHERE game.id = $1::int
				RETURNING id
			`, id, gameConsoleId, name, shortName, pattern, placeholder, sequence, isEnabled);
		}
		else
		{
			// Obtain last number in sequence for comparison purposes
			const [lastInSequence] = await query(`
				SELECT MAX(sequence)
				FROM game
				WHERE game.game_console_id = $1::int
			`, gameConsoleId);

			// Alter sequence for elements that have shifted positions due to new game
			if (sequence != null && lastInSequence.max + 1 < sequence)
			{
				// Input sequence is greater than list size plus the new game
				throw new UserError('bad-format');
			}
			else if (sequence != null && sequence <= lastInSequence.max)
			{
				// New game must go between existing games
				// All games afterwards must move one position downwards.
				await query(`
					UPDATE game
					SET sequence = sequence + 1
					WHERE game.game_console_id = $1::int AND $2::int <= sequence
				`, gameConsoleId, sequence);
			}

			return await query(`
				INSERT INTO game (game_console_id, name, short_name, pattern, placeholder, sequence, is_enabled)
				VALUES ($1::int, $2, $3, $4, $5, $6, $7::bool)
				RETURNING id
			`, gameConsoleId, name, shortName, pattern, placeholder, sequence, isEnabled);
		}
	});

	if (result.length === 0)
	{
		throw new UserError('no-such-game');
	}

	ACCCache.deleteMatch(constants.cacheKeys.games);

	return {
		id: result.id,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.gameId,
		nullable: true,
	},
	gameConsoleId: {
		type: APITypes.gameConsoleId,
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-game-name',
		length: constants.max.gameName,
		profanity: true,
	},
	shortName: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-game-short-name',
		length: constants.max.gameName,
		profanity: true,
	},
	pattern: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-game-pattern',
		length: constants.max.gamePattern,
	},
	placeholder: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-game-placeholder',
		length: constants.max.gamePlaceholder,
	},
	sequence: {
		type: APITypes.number,
		min: 1,
	},
	isEnabled: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type saveProps = {
	id: number | null
	gameConsoleId: number
	name: string
	shortName: string
	pattern: string
	placeholder: string
	sequence: number | null
	isEnabled: boolean
};

export default save;
