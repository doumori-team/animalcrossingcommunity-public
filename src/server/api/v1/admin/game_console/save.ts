import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, name, sequence, isLegacy, isEnabled }: saveProps): Promise<{ id: number }>
{
	const permission: boolean = await this.query('v1/permission', { permission: 'games-admin' });

	if (!permission)
	{
		throw new UserError('permission');
	}

	// Save information
	const result = await db.transaction(async (query: any) =>
	{
		if (id > 0)
		{
			// Obtain previous sequence number for this game_console
			const [previousConsoleInfo] = await query(`
				SELECT
					sequence
				FROM game_console
				WHERE game_console.id = $1::int
			`, id);

			if (!previousConsoleInfo)
			{
				throw new UserError('no-such-game-console');
			}

			// Alter sequence for elements that have shifted positions due to sequence change
			if (previousConsoleInfo.sequence > sequence)
			{
				// Modified game_console went up the list;
				// all game_consoles in between have been shifted one position downwards.
				await query(`
					UPDATE game_console
					SET sequence = sequence + 1
					WHERE sequence BETWEEN $1::int AND $2::int
				`, sequence, previousConsoleInfo.sequence);
			}
			else if (previousConsoleInfo.sequence < sequence)
			{
				// Obtain last number in sequence for comparison purposes
				const [lastInSequence] = await query(`
					SELECT MAX(sequence)
					FROM game_console
				`);

				if (lastInSequence.max < sequence)
				{
					// Input sequence is greater than list size
					throw new UserError('bad-format');
				}

				// Modified game_console went lower down the list;
				// all game_consoles in between have shifted one position upwards.
				await query(`
					UPDATE game_console
					SET sequence = sequence - 1
					WHERE sequence BETWEEN $1::int AND $2::int
				`, previousConsoleInfo.sequence, sequence);
			}

			return await query(`
				UPDATE game_console
				SET
					name = $2,
					sequence = $3::int,
					is_legacy = $4::bool,
					is_enabled = $5::bool
				WHERE id = $1::int
				RETURNING id
			`, id, name, sequence, isLegacy, isEnabled);
		}
		else
		{
			// Obtain last number in sequence for comparison purposes
			const [lastInSequence] = await query(`
				SELECT MAX(sequence)
				FROM game_console
			`);

			// Alter sequence for elements that have shifted positions due to new game_console
			if (lastInSequence.max + 1 < sequence)
			{
				// Input sequence is greater than list size plus the new game_console
				throw new UserError('bad-format');
			}
			else if (sequence <= lastInSequence.max)
			{
				// New game_console must go between existing game_consoles
				// All game_consoles afterwards must move one position downwards.
				await query(`
					UPDATE game_console
					SET sequence = sequence + 1
					WHERE $1::int <= sequence
				`, sequence);
			}

			return await query(`
				INSERT INTO game_console (name, sequence, is_legacy, is_enabled)
				VALUES ($1, $2::int, $3::bool, $4::bool)
				RETURNING id
			`, name, sequence, isLegacy, isEnabled);
		}
	});

	if (result.length === 0)
	{
		throw new UserError('no-such-game-console');
	}

	ACCCache.deleteMatch(constants.cacheKeys.games);

	return {
		id: result.id,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.gameConsoleId,
		nullable: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.gameName,
		profanity: true,
	},
	sequence: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	isLegacy: {
		type: APITypes.boolean,
		default: 'false',
	},
	isEnabled: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type saveProps = {
	id: number
	name: string
	sequence: number
	isLegacy: boolean
	isEnabled: boolean
};

export default save;
