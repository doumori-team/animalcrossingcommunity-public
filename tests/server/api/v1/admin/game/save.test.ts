import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/admin/game/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
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
	test('api tests are converted corrected', async () =>
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
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameConsoleId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
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

		mockAPIContext.query.mockResolvedValueOnce(true);

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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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

		mockAPIContext.query.mockResolvedValueOnce(true);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
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
});
