import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/character/catalog/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';
import { constants } from '@utils';
import * as acData from 'server/data/catalog/data.ts';

const data = {
	characterId: '641514',
	remove: '1376',
	inventory: [ '1370', '1371' ],
	wishlist: [ '1372', '1373' ],
	museum: [ '1374', '1375' ],
};

const expectedAPIData = {
	characterId: 641514,
	remove: [ '1376' ],
	inventory: [ '1370', '1371' ],
	wishlist: [ '1372', '1373' ],
	museum: [ '1374', '1375' ],
};

describe('save API function', () =>
{
	test('api tests are converted corrected', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
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

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(tempAPIContext)(save.apiTypes, data);

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if character user id does not match logged in user', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, game_id: constants.gameIds.ACGC }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if inventory id does not exist', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACGC;

		const tempData = {
			...data,
			inventory: [ 'RealItemId' ],
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce((acData.sortedAcGameCategories as any)[gameId]['all']['items']);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if wishlist id does not exist', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACGC;

		const tempData = {
			...data,
			wishlist: [ 'RealItemId' ],
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce((acData.sortedAcGameCategories as any)[gameId]['all']['items']);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if museum id does not exist', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACGC;

		const tempData = {
			...data,
			museum: [ 'RealItemId' ],
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce((acData.sortedAcGameCategories as any)[gameId]['all']['items']);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if remove id does not exist', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACGC;

		const tempData = {
			...data,
			remove: [ 'RealItemId' ],
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce((acData.sortedAcGameCategories as any)[gameId]['all']['items']);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should return success', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACGC;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.characterId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, game_id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce((acData.sortedAcGameCategories as any)[gameId]['all']['items']);
		mockDbQuery.mockImplementation(() => Promise.resolve([]));

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ _success: `Your catalog has been updated.` });
		expect(mockDbQuery).toBeCalledTimes(11);
	});
});
