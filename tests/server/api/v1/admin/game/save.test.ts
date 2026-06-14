import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/admin/game/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';
import * as db from '@db';

const data = {
	id: '0',
	gameConsoleId: '1',
	name: 'Advance Wars: Days of Ruin',
	shortName: 'Adv Wars: Days',
	pattern: '^[0-9]{6}-[0-9]{6}$',
	placeholder: '000000-000000',
	sequence: '0',
	isEnabled: 'true',
};

const expectedAPIData = {
	id: 0,
	gameConsoleId: 1,
	name: 'Advance Wars: Days of Ruin',
	shortName: 'Adv Wars: Days',
	pattern: '^[0-9]{6}-[0-9]{6}$',
	placeholder: '000000-000000',
	sequence: 0,
	isEnabled: true,
};

describe('save API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, save.permissions)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if placeholder does not match pattern', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			placeholder: '00-00',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if sequence is too large (ID, no previous sequence)', async () =>
	{
		// Arrange
		const gameId = 394;

		const tempData = {
			...data,
			id: gameId,
			sequence: 100,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: null }])
				.mockResolvedValueOnce([{ max: 1 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-game'));
	});

	test('should throw error if sequence is too large (ID w/previous sequence)', async () =>
	{
		// Arrange
		const gameId = 394;

		const tempData = {
			...data,
			id: gameId,
			sequence: 100,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: 10 }])
				.mockResolvedValueOnce([{ max: 1 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if sequence is too large (no ID)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			sequence: 100,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 1 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should update game if ID is provided', async () =>
	{
		// Arrange
		const gameId = 394;

		const tempData = {
			...data,
			id: gameId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: tempData.sequence }])
				.mockResolvedValueOnce([{ id: gameId }])
				.mockResolvedValueOnce({ id: gameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: gameId });
	});

	test('should update game if no ID is provided', async () =>
	{
		// Arrange
		const newGameId = 394;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 1 }])
				.mockResolvedValueOnce({ id: newGameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
	});

	test('should delete cache after saving', async () =>
	{
		// Arrange
		const newGameId = 394;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 1 }])
				.mockResolvedValueOnce({ id: newGameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
		expect(mockACCCache.deleteMatch).toBeCalledTimes(1);
	});

	test('sequence 0 is treated as null (no sequence)', async () =>
	{
		// Arrange
		const newGameId = 500;
		const tempData = {
			...data,
			sequence: '0',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 5 }])
				.mockResolvedValueOnce({ id: newGameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
	});

	test('should shift sequences down when existing game moves up the list', async () =>
	{
		// Arrange
		const gameId = 394;
		const tempData = {
			...data,
			id: String(gameId),
			sequence: '2', // moving from 5 to 2
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		const mockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			mockQuery
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: 5 }])
				// The code hits the "previousGameInfo.sequence > sequence" branch
				// which does an UPDATE SET directly (no separate shift query)
				.mockResolvedValueOnce({ id: gameId }) // first UPDATE RETURNING
				.mockResolvedValueOnce({ id: gameId }); // second UPDATE RETURNING

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: gameId });
	});

	test('should shift sequences up when existing game moves down the list', async () =>
	{
		// Arrange
		const gameId = 394;
		const tempData = {
			...data,
			id: String(gameId),
			sequence: '5', // moving from 2 to 5
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: 2 }])
				.mockResolvedValueOnce([{ max: 10 }]) // last in sequence check
				.mockResolvedValueOnce(undefined) // shift UPDATE
				.mockResolvedValueOnce({ id: gameId }); // final UPDATE RETURNING

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: gameId });
	});

	test('should remove sequence when game changes console', async () =>
	{
		// Arrange
		const gameId = 394;
		const newConsoleId = 2;
		const tempData = {
			...data,
			id: String(gameId),
			gameConsoleId: String(newConsoleId),
			sequence: '3',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: newConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				// Previous game info — different console
				.mockResolvedValueOnce([{ game_console_id: 1, sequence: 5 }])
				// Sequence removal shift (old console)
				.mockResolvedValueOnce(undefined)
				// Final UPDATE RETURNING
				.mockResolvedValueOnce({ id: gameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: gameId });
	});

	test('should insert new game between existing games (shift others down)', async () =>
	{
		// Arrange
		const newGameId = 500;
		const tempData = {
			...data,
			sequence: '2', // inserting at position 2
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		const mockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			mockQuery
				.mockResolvedValueOnce([{ max: 5 }]) // last in sequence
				.mockResolvedValueOnce(undefined) // shift UPDATE
				.mockResolvedValueOnce({ id: newGameId }); // INSERT RETURNING

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
		// Verify the shift query was called (3 queries total: max, shift, insert)
		expect(mockQuery).toHaveBeenCalledTimes(3);
	});

	test('should insert new game at end of list (no shift needed)', async () =>
	{
		// Arrange
		const newGameId = 500;
		const tempData = {
			...data,
			sequence: '6', // inserting at position 6, which is max+1
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 5 }]) // last in sequence — 6 == max+1, valid
				.mockResolvedValueOnce({ id: newGameId }); // INSERT RETURNING (no shift)

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
	});

	test('should handle sequence removal from existing game', async () =>
	{
		// Arrange
		const gameId = 394;
		const tempData = {
			...data,
			id: String(gameId),
			sequence: '0', // sequence 0 becomes null — removal
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				// Previous had a sequence
				.mockResolvedValueOnce([{ game_console_id: apiData.gameConsoleId, sequence: 3 }])
				// Shift others up
				.mockResolvedValueOnce(undefined)
				// Final UPDATE RETURNING
				.mockResolvedValueOnce({ id: gameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: gameId });
	});

	test('isEnabled false is saved correctly', async () =>
	{
		// Arrange
		const newGameId = 500;
		const tempData = {
			...data,
			isEnabled: 'false',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		expect(apiData.isEnabled).toBe(false);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ max: 1 }])
				.mockResolvedValueOnce({ id: newGameId });

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newGameId });
	});
});
