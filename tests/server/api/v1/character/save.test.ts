import { describe, test, expect, vi } from 'vitest';

import * as save from 'server/api/v1/character/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';
import { constants } from '@utils';
import * as db from '@db';

const data = {
	id: '0',
	townId: '571379',
	name: 'Alexandrea',
	bells: '33012',
	debt: '28131',
	houseSizeIds: [ '2' ],
	hraScore: '35620',
	faceId: '5',
};

const expectedAPIData = {
	id: 0,
	townId: 571379,
	name: 'Alexandrea',
	bells: 33012,
	debt: 28131,
	houseSizeIds: [ '2' ],
	hraScore: 35620,
	faceId: 5,
	nookMiles: 0,
	bedLocationId: null,
	happyHomeNetworkId: '',
	creatorId: '',
	paintId: null,
	monumentId: null,
};


describe('save API function', () =>
{
	test('api tests are converted corrected', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(tempAPIContext)(save.default.apiTypes, data);

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.default.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if house size contains non-number', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			houseSizeIds: [ 'RandomId' ],
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if house size validation fails', async () =>
	{
		// Arrange
		const houseSizeIds = expectedAPIData.houseSizeIds.map(id => Number(id));

		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validateHouseSizes.call(mockAPIContext, expectedAPIData.townId, houseSizeIds)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if bed location validation fails', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validateBedLocation.call(mockAPIContext, expectedAPIData.townId, 1)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if face validation fails', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validateFace.call(mockAPIContext, expectedAPIData.townId, expectedAPIData.faceId)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if paint validation fails', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validatePaint.call(mockAPIContext, expectedAPIData.townId, 1)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if monument validation fails', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validateMonument.call(mockAPIContext, expectedAPIData.townId, 1)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if character user is not logged in user (ID)', async () =>
	{
		// Arrange
		const characterId = 394;

		const tempData = {
			...data,
			id: characterId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: characterId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ town_id: expectedAPIData.townId, user_id: 255661, game_id: constants.gameIds.ACNL, max_characters: 4 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if happy home network validation fails', async () =>
	{
		// Act & Assert
		await expect(save.validateHappyHomeNetworkId.call(mockAPIContext, constants.gameIds.ACGC, '39283')).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if creator id validation fails', async () =>
	{
		// Act & Assert
		await expect(save.validateCreatorId.call(mockAPIContext, constants.gameIds.ACGC, '39283')).rejects.toThrow(new UserError('bad-format'));
	});

	test('should update character if ID provided', async () =>
	{
		// Arrange
		const characterId = 394;

		const tempData = {
			...data,
			id: characterId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: characterId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
					.mockResolvedValueOnce([{ town_id: expectedAPIData.townId, user_id: mockAPIContext.userId, game_id: constants.gameIds.ACNL, max_characters: 4 }])
					.mockResolvedValueOnce([])
					.mockResolvedValueOnce([])
					.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: characterId, userId: mockAPIContext.userId });
	});

	test('should throw error if character user is not logged in user (no ID)', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: 255661, game_id: constants.gameIds.ACNL, max_characters: 4 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if town has too many characters (no ID)', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: constants.gameIds.ACNL, max_characters: 4 }])
				.mockResolvedValueOnce([{ count: 100 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('too-many-characters'));
	});

	test('should throw error if user has too many characters (no ID)', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: constants.gameIds.ACNL, max_characters: 4 }])
				.mockResolvedValueOnce([{ count: 1 }])
				.mockResolvedValueOnce([{ count: constants.max.towns * 8 + 1 }]);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('too-many-town-characters'));
	});

	test('should update character if no ID provided', async () =>
	{
		// Arrange
		const newCharacterId = 394;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.townId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{}]);
		mockDbQuery.mockResolvedValueOnce([{}]);

		vi.spyOn(db, 'transaction').mockImplementation(async (operate: any) =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: constants.gameIds.ACNL, max_characters: 4 }])
				.mockResolvedValueOnce([{ count: 1 }])
				.mockResolvedValueOnce([{ count: 2 }])
				.mockResolvedValueOnce([{ id: newCharacterId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newCharacterId, userId: mockAPIContext.userId });
	});
});
