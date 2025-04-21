import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/feature/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';

const data = {
	id: '0',
	title: 'test feature',
	format: 'markdown',
	description: 'blah blah blah',
	categoryId: '',
	isBug: 'false',
	staffDescriptionFormat: 'markdown',
	staffDescription: '',
	assignedUsers: '',
	statusId: 'suggestion',
};

const expectedAPIData = {
	id: 0,
	title: 'test feature',
	format: 'markdown',
	description: 'blah blah blah',
	categoryId: null,
	isBug: false,
	staffDescriptionFormat: 'markdown',
	staffDescription: '',
	assignedUsers: [],
	statusId: 'suggestion',
	isExploit: false,
	staffOnly: false,
	readOnly: false,
};

describe('save API function', () =>
{
	test('api tests are converted corrected', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
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

		const apiData = await APITypes.parse.bind(tempAPIContext)(save.apiTypes, data);

		tempAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(save.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if status not found', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-feature-status'));
	});

	test('should throw error if category not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			categoryId: 392,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-feature-category'));
	});

	test('should throw error if assigned user does not exist', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			assignedUsers: 'PikminFan123',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user'));
	});

	test('should throw error if unable to edit feature', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if feature does not exist', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(save.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-feature'));
	});

	test('should update feature if ID is provided', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: featureId }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: featureId });
	});

	test('should insert feature if no ID is provided', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should return success if exploit', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const tempData = {
			...data,
			isExploit: 'true',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId, _success: 'This feature / bug has been submitted. Thank you for letting us know!' });
	});
});
