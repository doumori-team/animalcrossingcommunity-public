import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/shop/save';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';
import * as acData from 'server/data/catalog/data.ts';
import * as db from '@db';

const data = {
	id: '0',
	name: "Lauren's Shop",
	shortDescription: 'Random Short Description',
	format: 'markdown',
	description: 'Random Description',
	games: '8',
	perOrders: '20',
	stackOrQuantities: 'true',
	completeOrders: 'true',
	items: 's5ZQQKh3XYcue8R6S', // Housewares, antique bed
	vacationStartDate: '',
	vacationEndDate: '',
	allowTransfer: 'true',
};

const expectedAPIData = {
	id: 0,
	name: "Lauren's Shop",
	shortDescription: 'Random Short Description',
	format: 'markdown',
	description: 'Random Description',
	games: ['8'],
	perOrders: ['20'],
	stackOrQuantities: [true],
	completeOrders: [true],
	items: [['s5ZQQKh3XYcue8R6S']],
	vacationStartDate: null,
	vacationEndDate: null,
	allowTransfer: true,
	fee: false,
	active: false,
	fileId: null,
};

describe('save API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
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

	test('should throw error if games arrays incorrect length', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			perOrders: ['20','20'],
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if shop has too many items', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			items: [
				Array(501).fill('s5ZQQKh3XYcue8R6S'),
				Array(501).fill('s5ZQQKh3XYcue8R6S'),
			],
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('shop-max-items'));
	});

	test('should throw error if game id does not exist', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-ac-game'));
	});

	test('should throw error if item does not exist', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should create shop if no ID provided', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});

	test('should throw error if shop does not exist', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: '4938',
		};

		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockAPIContext.query.mockResolvedValueOnce(null);

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
	});

	test('should throw error if shop updated by non-owner', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: '4938',
		};

		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockAPIContext.query.mockResolvedValueOnce({ owners: [] });

			return await operate(mockQuery);
		});

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should create shop if ID provided', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: '4938',
		};

		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockAPIContext.query.mockResolvedValueOnce({ owners: [{ id: mockAPIContext.userId }] });

			mockQuery
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: apiData.id });
	});

	test('should set header file if provided', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: '4938',
			fileId: '8816eed6-bd87-4f74-a708-4f3d958abb3b.png',
		};

		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockAPIContext.query.mockResolvedValueOnce({ owners: [{ id: mockAPIContext.userId }] });

			mockQuery
				.mockResolvedValueOnce([{ id: 48373 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: apiData.id });
	});

	test('should create shop with no items', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const tempData = {
			...data,
			items: '',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});

	test('should create shop with fee enabled', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const tempData = {
			...data,
			fee: 'true',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});

	test('should create shop with active enabled', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const tempData = {
			...data,
			active: 'true',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});

	test('should create shop with vacation dates', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const tempData = {
			...data,
			vacationStartDate: '2025-07-01',
			vacationEndDate: '2025-07-15',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});

	test('should delete old games and items on edit', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: '4938',
		};

		const gameId = constants.gameIds.ACNH;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			mockAPIContext.query.mockResolvedValueOnce({ owners: [{ id: mockAPIContext.userId }] });

			transactionMockQuery
				.mockResolvedValueOnce([]) // update shop
				.mockResolvedValueOnce([]) // delete shop_ac_game
				.mockResolvedValueOnce([]) // delete shop_catalog_item
				.mockResolvedValueOnce([]) // insert game
				.mockResolvedValueOnce([]) // insert item
				.mockResolvedValueOnce([]) // audit name
				.mockResolvedValueOnce([]) // audit short desc
				.mockResolvedValueOnce([]) // audit desc
				.mockResolvedValueOnce([]); // audit image

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: apiData.id });

		const deleteGameCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('DELETE FROM shop_ac_game'),
		);

		expect(deleteGameCall).toBeTruthy();

		const deleteItemCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('DELETE FROM shop_catalog_item'),
		);

		expect(deleteItemCall).toBeTruthy();
	});

	test('should create owner role and shop user on new shop', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([{ id: shopId }]) // insert shop
				.mockResolvedValueOnce([{ id: 5849 }]) // insert role
				.mockResolvedValueOnce([{ id: 8574 }]) // insert shop_user
				.mockResolvedValueOnce([]) // insert shop_user_role
				.mockResolvedValueOnce([]) // insert game
				.mockResolvedValueOnce([]) // insert item
				.mockResolvedValueOnce([]) // audit name
				.mockResolvedValueOnce([]) // audit short desc
				.mockResolvedValueOnce([]) // audit desc
				.mockResolvedValueOnce([]); // audit image

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });

		const roleCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO shop_role'),
		);

		expect(roleCall).toBeTruthy();

		const shopUserCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO shop_user'),
		);

		expect(shopUserCall).toBeTruthy();
		expect(shopUserCall![2]).toEqual(mockAPIContext.userId);

		const shopUserRoleCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO shop_user_role'),
		);

		expect(shopUserRoleCall).toBeTruthy();
	});

	test('should insert shop audit records', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });

		const auditCalls = transactionMockQuery.mock.calls.filter(([sql]) =>
			sql.includes('INSERT INTO shop_audit'),
		);

		expect(auditCalls.length).toEqual(4);
	});

	test('should handle falsy stackOrQuantities and completeOrders', async () =>
	{
		// Arrange
		const gameId = constants.gameIds.ACNH;
		const shopId = 483;

		const tempData = {
			...data,
			stackOrQuantities: '',
			completeOrders: '',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		mockACCCache.get.mockResolvedValueOnce(acData.sortedAcGameCategories[gameId]['all']['items']);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: shopId }])
				.mockResolvedValueOnce([{ id: 5849 }])
				.mockResolvedValueOnce([{ id: 8574 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: shopId });
	});
});
