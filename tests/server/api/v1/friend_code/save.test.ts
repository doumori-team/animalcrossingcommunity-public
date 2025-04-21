import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/friend_code/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';
import * as db from '@db';
import { constants } from '@utils';

const data = {
	id: '0',
	gameId: '169',
	code: '3920-2932-1923',
	characterId: '641514',
};

const expectedAPIData = {
	id: 0,
	gameId: 169,
	code: '3920-2932-1923',
	characterId: 641514,
};

describe('save API function', () =>
{
	test('api tests are converted corrected', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(tempAPIContext)(save.apiTypes, data);

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if friend code does not match pattern', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: 'test' }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if character game is not for friend code game', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNH, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if character user is not logged in user', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: 255661 }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if character user is not friend code user', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 483,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661 }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if friend code already exists', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 584 }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('existing-friend-code'));
	});

	test('should throw error if friend code does not exist', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 483,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-friend-code'));
	});

	test('should throw error if friend code does not match logged in user', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 483,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: 255661 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should update feature if ID provided', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }])
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce([[]]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: featureId, userId: mockAPIContext.userId });
	});

	test('should insert feature if no ID provided', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newFeatureId }])
				.mockResolvedValueOnce([[]]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId, userId: mockAPIContext.userId });
	});
});
