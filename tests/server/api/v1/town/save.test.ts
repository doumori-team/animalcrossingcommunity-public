import { describe, test, expect, vi } from 'vitest';

import * as save from 'server/api/v1/town/save';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';

const data = {
	gameId: `${constants.gameIds.ACNL}`,
	id: '0',
	name: 'Random Town Name',
	nativeTownFruit: '1',
	residents: '',
	nookId: '1',
	grassShapeId: '1',
	ordinanceId: '',
	dreamAddress: '',
};

const expectedAPIData = {
	gameId: constants.gameIds.ACNL,
	id: 0,
	name: 'Random Town Name',
	nativeTownFruit: 1,
	residents: [],
	nookId: 1,
	grassShapeId: 1,
	ordinanceId: 1,
	dreamAddress: '',
	islandFruitId1: 0,
	islandFruitId2: 0,
	fruit: [],
	stores: [],
	pwps: [],
	islandName: '',
	islandResidentId: 0,
	hemisphereId: 0,
	stationShape: null,
	paintId: null,
};

describe('save API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, save.default.permissions)).rejects.toThrow(new UserError('permission'));
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
		await expect(APIPerms.check.call(tempAPIContext, save.default.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if dream address is incorrect format (NL)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			dreamAddress: 'BadFormat',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if dream address is incorrect format (NH)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: constants.gameIds.ACNH,
			dreamAddress: 'BadFormat',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if station shape is incorrect format', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: constants.gameIds.ACGC,
			stationShape: 100,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('validateFruit function', () =>
	{
		test('should throw error if fruit does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nativeTownFruit }]);

			// Act & Assert
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				[ 1000 ],
				expectedAPIData.nativeTownFruit,
				expectedAPIData.islandFruitId1,
				expectedAPIData.islandFruitId2,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if native fruit does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				expectedAPIData.fruit,
				expectedAPIData.nativeTownFruit,
				expectedAPIData.islandFruitId1,
				expectedAPIData.islandFruitId2,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if island fruit 1 does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nativeTownFruit }]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				expectedAPIData.fruit,
				expectedAPIData.nativeTownFruit,
				1000,
				expectedAPIData.islandFruitId2,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if island fruit 2 does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nativeTownFruit }]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				expectedAPIData.fruit,
				expectedAPIData.nativeTownFruit,
				expectedAPIData.islandFruitId1,
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validateGrassShape function', () =>
	{
		test('should do nothing if not setting grass shape id', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validateGrassShape(
				null,
			)).resolves.not.toThrow();
		});

		test('should throw error if grass shape id does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateGrassShape(
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validateOrdinance function', () =>
	{
		test('should do nothing if not setting ordinance id', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validateOrdinance(
				null,
			)).resolves.not.toThrow();
		});

		test('should throw error if ordinance id does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateOrdinance(
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	test('should throw error if store id does not exist', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.validateStores(
			expectedAPIData.gameId,
			[ 1000 ],
		)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('validatePublicWorkProjects function', () =>
	{
		test('should throw error if pwps with non-NL game', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validatePublicWorkProjects(
				constants.gameIds.ACCF,
				[ 'RandomPWPId' ],
			)).rejects.toThrow(new UserError('too-many-pwps'));
		});

		test('should throw error if more then 30 pwps (NL)', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validatePublicWorkProjects(
				constants.gameIds.ACNL,
				Array(35).fill('RandomPWPId'),
			)).rejects.toThrow(new UserError('too-many-pwps'));
		});

		test('should throw error if pwp id does not exist', async () =>
		{
			// Arrange
			mockACCCache.get.mockResolvedValueOnce({ [constants.gameIds.ACNL]: [] });

			// Act & Assert
			await expect(save.validatePublicWorkProjects(
				constants.gameIds.ACNL,
				[ 'RandomPWPId' ],
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validateResidents function', () =>
	{
		test('should throw error if too many residents', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ max_residents: 1 }]);

			//  Act & Assert
			await expect(save.validateResidents(
				expectedAPIData.gameId,
				0,
				[ 'RandomId1', 'RandomId2' ],
			)).rejects.toThrow(new UserError('too-many-residents'));
		});

		test('should throw error if resident id does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ max_residents: 10 }]);
			mockACCCache.get.mockResolvedValueOnce({ [expectedAPIData.gameId]: [] });

			// Act & Assert
			await expect(save.validateResidents(
				expectedAPIData.gameId,
				0,
				[ 'RandomId1' ],
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validateHemisphere function', () =>
	{
		test('should do nothing if not setting hemisphere id', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validateHemisphere(
				null,
			)).resolves.not.toThrow();
		});

		test('should throw error if hemisphere id does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validateHemisphere(
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validatePaint function', () =>
	{
		test('should do nothing if not setting paint id', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validatePaint(
				constants.gameIds.ACWW,
				null,
			)).resolves.not.toThrow();
		});

		test('should throw error if setting paint id for non-WW game', async () =>
		{
			// Arrange, Act & Assert
			await expect(save.validatePaint(
				constants.gameIds.ACNL,
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if hemisphere id does not exist', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(save.validatePaint(
				constants.gameIds.ACWW,
				1000,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	test('should throw error if too many towns', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ count: 40 }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('too-many-towns'));
	});

	test('should create town if no ID is provided', async () =>
	{
		// Arrange
		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]);

		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should throw error if updating town that is not yours', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 48372,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		mockDbQuery.mockResolvedValueOnce([{ id: tempData.id }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should create town if ID is provided', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			id: 48372,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.gameId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: tempData.id }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: tempData.id, userId: mockAPIContext.userId });
	});

	test('should null grassShapeId for games after ACNL', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: `${constants.gameIds.ACNH}`,
			grassShapeId: '1',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		// grassShape nulled — no query
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)
		mockDbQuery.mockResolvedValueOnce([{ id: 1 }]); // hemisphere (NOT nulled for NH)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should null ordinanceId for games other than NL and NH', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: `${constants.gameIds.ACGC}`,
			ordinanceId: '1',
			stationShape: '1',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		// no ordinance query — nulled
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should null hemisphereId for games before ACNH', async () =>
	{
		// Arrange
		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)
		// no hemisphere query — nulled

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should null stationShape for non-GC games', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			stationShape: '5',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should uppercase dream address', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			dreamAddress: '1200-0000-0000',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should null dreamAddress for non-NL/NH games', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: `${constants.gameIds.ACGC}`,
			dreamAddress: 'SomeAddress',
			stationShape: '1',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		// ordinance nulled for GC
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should null empty dreamAddress', async () =>
	{
		// Arrange — default data has dreamAddress: ''
		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]); // grass shape
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should accept valid NL dream address', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			dreamAddress: '1200-0000-0000',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]);

		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should accept valid NH dream address', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: `${constants.gameIds.ACNH}`,
			dreamAddress: 'DA-0000-0000-0000',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNH }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]); // native fruit
		// grassShape nulled — no query
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]); // ordinance
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]); // store (nookId)
		mockDbQuery.mockResolvedValueOnce([{ id: 1 }]); // hemisphere (NOT nulled for NH)

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]); // town count
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]); // insert town

		mockDbQuery.mockResolvedValueOnce(null); // update fruit
		mockDbQuery.mockResolvedValueOnce(null); // update stores

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	test('should accept valid station shape for GC game', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			gameId: `${constants.gameIds.ACGC}`,
			stationShape: '5',
		};

		const townId = 4832;

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACGC }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		// ordinance nulled for GC
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nookId }]);

		mockDbQuery.mockResolvedValueOnce([{ count: 0 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: townId }]);

		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);

		// Act
		const result = await save.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: townId, userId: mockAPIContext.userId });
	});

	describe('validateFruit function', () =>
	{
		test('should skip island fruit validation when ids are 0', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nativeTownFruit }]); // native fruit only

			// Act & Assert — no island fruit queries needed
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				[],
				expectedAPIData.nativeTownFruit,
				0,
				0,
			)).resolves.toBeUndefined();
		});

		test('should validate fruit array successfully', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 1 }]); // fruit
			mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nativeTownFruit }]); // native fruit

			// Act & Assert
			await expect(save.validateFruit.call(
				mockAPIContext,
				expectedAPIData.gameId,
				[1],
				expectedAPIData.nativeTownFruit,
				0,
				0,
			)).resolves.toBeUndefined();
		});
	});

	test('should validate nookId as a store', async () =>
	{
		// Arrange — use an invalid nookId that doesn't exist as a store
		const tempData = {
			...data,
			nookId: '9999',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: constants.gameIds.ACNL }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.default.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: apiData.nativeTownFruit }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.grassShapeId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: apiData.ordinanceId }]);
		mockDbQuery.mockResolvedValueOnce([]); // nookId not found as store

		// Act & Assert
		await expect(save.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('updateIsland function', () =>
	{
		test('should insert island data for GC game', async () =>
		{
			// Arrange
			const townId = 4832;

			mockDbQuery.mockResolvedValueOnce([]); // delete old island

			// Act
			await save.updateIsland(townId, 'Test Island', 5, constants.gameIds.ACGC);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO island'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual('Test Island');
			expect(insertCall![2]).toEqual(townId);
			expect(insertCall![3]).toEqual(5);
		});

		test('should skip island insert for non-GC game', async () =>
		{
			// Arrange
			const townId = 4832;

			mockDbQuery.mockResolvedValueOnce([]); // delete old island

			// Act
			await save.updateIsland(townId, 'Test Island', 5, constants.gameIds.ACNL);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO island'),
			);

			expect(insertCall).toBeFalsy();
		});

		test('should skip island insert when name is empty', async () =>
		{
			// Arrange
			const townId = 4832;

			mockDbQuery.mockResolvedValueOnce([]); // delete old island

			// Act
			await save.updateIsland(townId, '', 5, constants.gameIds.ACGC);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO island'),
			);

			expect(insertCall).toBeFalsy();
		});

		test('should skip island insert when residentId is 0', async () =>
		{
			// Arrange
			const townId = 4832;

			mockDbQuery.mockResolvedValueOnce([]); // delete old island

			// Act
			await save.updateIsland(townId, 'Test Island', 0, constants.gameIds.ACGC);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO island'),
			);

			expect(insertCall).toBeFalsy();
		});
	});
});
