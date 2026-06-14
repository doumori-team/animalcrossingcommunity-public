import { describe, test, expect, vi } from 'vitest';

import permission from 'server/api/v1/node/permission';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';

const data = {
	permission: 'read',
	nodeId: constants.boardIds.accForums,
};

const expectedAPIData = {
	permission: 'read',
	nodeId: constants.boardIds.accForums,
	userId: mockAPIContext.userId,
};

describe('permission API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			userId: constants.accUserId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(permission.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should return false if user is banned', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: null, identifier: null, parent_node_id: null, locked: null, thread_type: null, parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([{ description: 'Permanent' }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if locked and user is anonymous', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: 0,
			query: vi.fn(),
			fullQuery: vi.fn(),
		};

		const tempData = {
			...data,
			nodeId: 6579321,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(tempAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([]);
		tempAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);

		// Act
		const result = await permission.call(tempAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if locked and trying to lock it', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 6579321,
			permission: 'lock',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.lock }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if locked and trying to reply to it', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 6579321,
			permission: 'reply',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.reply }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if locked and trying to sticky it', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 6579321,
			permission: 'sticky',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.sticky }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if locked and trying to admin-lock it', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 6579321,
			permission: 'admin-lock',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.adminLock }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return false if admin-locked, not an admin and trying to post', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400001668,
			permission: 'reply',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.staffIdentifiers.admin, parent_node_id: 200000003, locked: null, thread_type: 'admin', parent_node_id2: 300000009 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.reply }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return true changing title on your own thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'edit',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.edit }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true locking your own thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'lock',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.lock }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true adding users to your own thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'add-users',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.addUsers }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return false if trying to edit anything that is not yours', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'edit',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.staffIdentifiers.admin, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.edit }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return true if reading another PT as a modmin', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.admin }]);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should read from database if viewing admin PT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.staffIdentifiers.admin, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.admin }]);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type_id: mockAPIContext.userId, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true if reading Adoptee BT as Scout', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: constants.boardIds.adopteeBT,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.adopteeThread, locked: null, thread_type: 'normal', parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.scout }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true if reading post on Adoptee BT as Scout', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 4857483,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.adopteeBT, locked: null, thread_type: null, parent_node_id2: constants.boardIds.adopteeThread }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.scout }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true if replying to Adoptee BT as Scout', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: constants.boardIds.adopteeBT,
			permission: 'reply',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.adopteeThread, locked: null, thread_type: 'normal', parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.scout }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.reply }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should read from database if viewing public thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400019478,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: 200000337, locked: null, thread_type: 'normal', parent_node_id2: 200000002 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: constants.boardIds.accForums, granted: true, sequence: 4 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should skip admin check for anonymous userId', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: 0,
			query: vi.fn(),
			fullQuery: vi.fn(),
		};

		const tempData = {
			...data,
			userId: 0,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(tempAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: null, identifier: null, parent_node_id: null, locked: null, thread_type: null, parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([]);
		tempAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 0, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(tempAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should allow admin to check another users permissions', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			userId: constants.accUserId,
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true); // permission-admin

		mockDbQuery.mockResolvedValueOnce([{ user_id: null, identifier: null, parent_node_id: null, locked: null, thread_type: null, parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should allow read permission on locked thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 6579321,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 841009, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: '2023-01-18 12:35:47.000', thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should allow admin to reply to admin-locked thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400001668,
			permission: 'reply',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.staffIdentifiers.admin, parent_node_id: 200000003, locked: null, thread_type: 'admin', parent_node_id2: 300000009 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.admin }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.reply }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should fall through to DB check for add-users on non-PT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'add-users',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		// Own node but parent is not PT or Shop Thread
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: 200000062, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.addUsers }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([]); // DB check returns no grant

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should check remove-users permission via DB', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'remove-users',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.removeUsers }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type_id: mockAPIContext.userId, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should check react permission via DB', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400019478,
			permission: 'react',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.groupIdentifiers.user, parent_node_id: 200000337, locked: null, thread_type: 'normal', parent_node_id2: 200000002 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.react }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: tempData.nodeId, granted: true, sequence: 4 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should check move permission via DB', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400019478,
			permission: 'move',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.groupIdentifiers.user, parent_node_id: 200000337, locked: null, thread_type: 'normal', parent_node_id2: 200000002 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.move }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type: 'group', type_id: 1, node_id: tempData.nodeId, granted: true, sequence: 4 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should fall through to DB check for non-modmin reading PT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false); // no viewPTs
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type_id: mockAPIContext.userId, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return false for non-modmin reading PT without user permission', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false); // no viewPTs
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([]); // no user permission

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should return true for admin reading their own admin PT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400020645,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, identifier: constants.staffIdentifiers.admin, parent_node_id: constants.boardIds.privateThreads, locked: null, thread_type: 'normal', parent_node_id2: constants.boardIds.accForums }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.admin }]);
		mockAPIContext.query.mockResolvedValueOnce(true); // viewPTs
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return true for scout reacting to Adoptee BT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: constants.boardIds.adopteeBT,
			permission: 'react',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: constants.boardIds.adopteeThread, locked: null, thread_type: 'normal', parent_node_id2: null }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.staffIdentifiers.scout }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.react }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should use parent_node_id2 to identify PT/Shop Thread/Adoptee Thread', async () =>
	{
		// Arrange — post on a PT where parent_node_id is the thread, parent_node_id2 is PTs board
		const tempData = {
			...data,
			nodeId: 4857483,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: 255661, identifier: constants.groupIdentifiers.user, parent_node_id: 400020645, locked: null, thread_type: null, parent_node_id2: constants.boardIds.privateThreads }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false); // no viewPTs
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([{ type_id: mockAPIContext.userId, node_id: tempData.nodeId, granted: true, sequence: 1 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});

	test('should return false when group permission denies access', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			nodeId: 400019478,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: 200000337, locked: null, thread_type: 'normal', parent_node_id2: 200000002 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockDbQuery.mockResolvedValueOnce([]); // no matching permission

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(false);
	});

	test('should prioritize user permission over group permission', async () =>
	{
		// Arrange — user permission grants access even if group might not
		const tempData = {
			...data,
			nodeId: 400019478,
			permission: 'read',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: tempData.nodeId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(permission.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, identifier: constants.groupIdentifiers.user, parent_node_id: 200000337, locked: null, thread_type: 'normal', parent_node_id2: 200000002 }]);
		mockDbQuery.mockResolvedValueOnce([{ identifier: constants.groupIdentifiers.user }]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.nodePermissions.read }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// User permission returned first due to ORDER BY type DESC (user > group)
		mockDbQuery.mockResolvedValueOnce([{ type: 'user', type_id: mockAPIContext.userId, node_id: tempData.nodeId, granted: true, sequence: 4 }]);

		// Act
		const result = await permission.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(true);
	});
});
