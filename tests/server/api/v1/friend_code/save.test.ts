import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/friend_code/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
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
	test('api tests are converted correctly', async () =>
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
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, save.permissions)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
			fullQuery: vi.fn(),
		};

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(APIPerms.check.call(tempAPIContext, save.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if friend code does not match pattern', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

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

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
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

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
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

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
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

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]);
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
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

	test('should skip character validation when characterId is 0', async () =>
	{
		// Arrange
		const newFriendCodeId = 483;

		const tempData = {
			...data,
			characterId: '0',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]); // game
		// no character queries — skipped
		mockDbQuery.mockResolvedValueOnce([]); // no existing FC

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newFriendCodeId }]); // insert FC

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFriendCodeId, userId: mockAPIContext.userId });
	});

	test('should link character and update listing offers on insert', async () =>
	{
		// Arrange
		const newFriendCodeId = 483;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]); // game
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]); // character check
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]); // ac game check
		mockDbQuery.mockResolvedValueOnce([]); // no existing FC

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newFriendCodeId }]) // insert FC
				.mockResolvedValueOnce([{ id: 101 }, { id: 102 }]) // listing offers
				.mockResolvedValueOnce(null) // delete friend_code_character
				.mockResolvedValueOnce(null) // insert friend_code_character
				.mockResolvedValueOnce(null) // update listing 101
				.mockResolvedValueOnce(null); // update listing 102

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFriendCodeId, userId: mockAPIContext.userId });
	});

	test('should link character and update listing offers on update', async () =>
	{
		// Arrange
		const friendCodeId = 483;

		const tempData = {
			...data,
			id: friendCodeId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]); // game
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]); // character check
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]); // ac game check
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]); // friend code user check
		mockDbQuery.mockResolvedValueOnce([]); // no existing FC

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]) // friend code lookup
				.mockResolvedValueOnce(null) // update FC
				.mockResolvedValueOnce([{ id: 201 }]) // listing offers
				.mockResolvedValueOnce(null) // delete friend_code_character
				.mockResolvedValueOnce(null) // insert friend_code_character
				.mockResolvedValueOnce(null); // update listing 201

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: friendCodeId, userId: mockAPIContext.userId });
	});

	test('should skip character linking when characterId is 0 in transaction', async () =>
	{
		// Arrange
		const friendCodeId = 483;

		const tempData = {
			...data,
			id: friendCodeId,
			characterId: '0',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]); // game
		// no character queries
		mockDbQuery.mockResolvedValueOnce([]); // no existing FC

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]) // friend code lookup
				.mockResolvedValueOnce(null); // update FC
			// no character linking queries

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: friendCodeId, userId: mockAPIContext.userId });
	});

	test('should skip listing offer updates when no active listings', async () =>
	{
		// Arrange
		const newFriendCodeId = 483;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}$' }]); // game
		mockDbQuery.mockResolvedValueOnce([{ game_id: constants.gameIds.ACNL, user_id: mockAPIContext.userId }]); // character check
		mockDbQuery.mockResolvedValueOnce([{ acgame_id: constants.gameIds.ACNL }]); // ac game check
		mockDbQuery.mockResolvedValueOnce([]); // no existing FC

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newFriendCodeId }]) // insert FC
				.mockResolvedValueOnce([]) // no listing offers
				.mockResolvedValueOnce(null) // delete friend_code_character
				.mockResolvedValueOnce(null); // insert friend_code_character

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFriendCodeId, userId: mockAPIContext.userId });
	});
});
