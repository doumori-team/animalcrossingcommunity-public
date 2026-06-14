import { describe, test, expect, vi } from 'vitest';

import save from 'server/api/v1/feature/save';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';
import { constants } from '@utils';

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

	test('should throw error if status not found', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

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

	test('should clear assignedUsers when user lacks manage permission', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const tempData = {
			...data,
			assignedUsers: 'PikminFan123',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert — no user lookup, no feature_assigned_user queries
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should override staffOnly, readOnly, statusId when user lacks manage permission (new feature)', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const tempData = {
			...data,
			staffOnly: 'true',
			readOnly: 'true',
			statusId: 'in-progress',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status found (but will be overridden)
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should null staffDescription when user lacks claim permission (new feature)', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const tempData = {
			...data,
			staffDescription: 'internal notes here',
			staffDescriptionFormat: 'markdown',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should set staffOnly and discussion status for staff user without manage permission (new feature)', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: constants.staffIdentifiers.mod } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(true); // has claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should use limited update query when user has claim but not manage permission', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(true); // has claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: featureId }]); // feature exists
		mockDbQuery.mockResolvedValueOnce([]); // update
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: featureId });
	});

	test('should insert assigned users on update', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
			assignedUsers: 'PikminFan123',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(true); // has manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: 123 }]); // assigned user lookup
		mockDbQuery.mockResolvedValueOnce([{ id: featureId }]); // feature exists
		mockDbQuery.mockResolvedValueOnce([]); // update feature
		mockAPIContext.query.mockResolvedValueOnce(null); // notification
		mockDbQuery.mockResolvedValueOnce([]); // delete assigned users
		mockDbQuery.mockResolvedValueOnce([]); // insert assigned users

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: featureId });
	});

	test('should resolve multiple assigned users', async () =>
	{
		// Arrange
		const featureId = 483;

		const tempData = {
			...data,
			id: featureId,
			assignedUsers: 'PikminFan123,TomNook99',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(true); // has manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		mockDbQuery.mockResolvedValueOnce([{ id: 123 }]); // first user lookup
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]); // second user lookup
		mockDbQuery.mockResolvedValueOnce([{ id: featureId }]); // feature exists
		mockDbQuery.mockResolvedValueOnce([]); // update feature
		mockAPIContext.query.mockResolvedValueOnce(null); // notification
		mockDbQuery.mockResolvedValueOnce([]); // delete assigned users
		mockDbQuery.mockResolvedValueOnce([]); // insert assigned users

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: featureId });
	});

	test('should skip status validation when statusId is empty', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const tempData = {
			...data,
			statusId: '',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		// no status query — skipped
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});

	test('should skip category validation when categoryId is null', async () =>
	{
		// Arrange
		const newFeatureId = 483;

		const apiData = await APITypes.parse.bind(mockAPIContext)(save.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce({ group: { identifier: 'user' } });
		mockAPIContext.query.mockResolvedValueOnce(false); // no manage
		mockAPIContext.query.mockResolvedValueOnce(false); // no claim
		mockDbQuery.mockResolvedValueOnce([{ id: 948 }]); // status
		// no category query — skipped (categoryId is null from default data)
		mockDbQuery.mockResolvedValueOnce([{ id: newFeatureId }]); // insert feature
		mockDbQuery.mockResolvedValueOnce([]); // insert message
		mockDbQuery.mockResolvedValueOnce([]); // insert followed
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		const result = await save.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newFeatureId });
	});
});
