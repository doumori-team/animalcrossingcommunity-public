import { describe, test, expect, vi } from 'vitest';

import complete from 'server/api/v1/user_ticket/complete';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockAccountsEmailUser } from 'tests/vitest.setup.ts';

const data = {
	id: '48374',
	ruleId: '49384',
	violationId: '493284',
	actionId: '3',
	updatedContent: '{color:mediumblue}*content removed*{color}',
	banLengthId: '0',
};

const expectedAPIData = {
	id: 48374,
	ruleId: 49384,
	violationId: 493284,
	actionId: 3,
	updatedContent: '{color:mediumblue}*content removed*{color}',
	banLengthId: 0,
	boardId: 0,
};

const actions = [
	{ id: 1, identifier: 'no_action', name: 'No Action', types: [
		'thread',
		'post',
		'pattern',
		'tune',
		'map',
		'town',
		'character',
		'rating',
		'listing',
		'listing_comment',
		'offer',
		'profile_location',
		'profile_signature',
		'profile_bio',
		'profile_username',
		'profile_name',
		'profile_user_title',
		'town_tune',
		'town_flag',
		'profile_image',
		'post_image',
		'shop_name',
		'shop_short_description',
		'shop_description',
		'shop_image',
		'shop_role_name',
		'shop_role_description',
		'shop_service_name',
		'shop_service_description',
		'shop_order',
		'shop_application',
	] },
	{ id: 2, identifier: 'delete', name: 'Delete Content', types: [
		'pattern',
		'tune',
		'map',
		'town',
		'character',
		'rating',
		'listing',
		'offer',
		'profile_location',
		'profile_signature',
		'profile_name',
		'profile_user_title',
		'town_tune',
		'town_flag',
		'profile_image',
		'post_image',
		'shop_image',
	] },
	{ id: 3, identifier: 'modify', name: 'Modify Content', types: [
		'thread',
		'post',
		'listing',
		'listing_comment',
		'offer',
		'profile_bio',
		'profile_username',
		'shop_name',
		'shop_short_description',
		'shop_description',
		'shop_role_name',
		'shop_role_description',
		'shop_service_name',
		'shop_service_description',
		'shop_order',
		'shop_application',
	] },
	{ id: 4, identifier: 'lock_thread', name: 'Lock Thread', types: [ 'thread' ] },
	{ id: 5, identifier: 'move_thread', name: 'Move Thread', types: [ 'thread' ] },
	{ id: 6, identifier: 'unknown_action', name: 'Unknown Action', types: [] },
];

describe('complete API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, complete.permissions)).rejects.toThrow(new UserError('permission'));
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
		await expect(APIPerms.check.call(tempAPIContext, complete.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if user ticket not found', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([]);
		mockAPIContext.query.mockResolvedValueOnce(actions);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user-ticket'));
	});

	test('should throw error if action not found', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if type not found', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce([{ id: 3, identifier: 'modify', name: 'Modify Content', types: [ 'thread' ] }]);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if reducing ban length with no ban length', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce({ id: 7, description: 'Permanent', days: null });

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('shorter-ban'));
	});

	test('should throw error if ban length not found', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			banLengthId: '1',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce({ id: 7, description: 'Permanent', days: null });
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if reducing ban length with ban length', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			banLengthId: '1',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce({ id: 7, description: 'Permanent', days: null });
		mockDbQuery.mockResolvedValueOnce([{ days: 1 }]);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('shorter-ban'));
	});

	test('should throw error if moving thread without board id', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '5',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'thread', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if not assigned to you', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: constants.accUserId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if in wrong status', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.closed, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act & Assert
		await expect(complete.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should complete UT', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null);

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should complete UT if banned', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			banLengthId: '1',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([{ days: null }]);

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockAPIContext.query.mockResolvedValueOnce(null);

		mockAPIContext.query.mockResolvedValueOnce({
			violator: {
				username: 'ACC',
			},
			reference: {
				text: 'Random Test',
			},
			type: {
				description: 'Forum Post',
			},
			rule: 'Keeping threads made on ACC meaningful is a top priority. Any of the following, as well as other content up to ACC Staff discretion, may be considered of poor quality and subject to removal.',
		});
		mockDbQuery.mockResolvedValueOnce([{ description: '', severity_id: '', violation: '' }]);
		mockDbQuery.mockResolvedValueOnce([{ days: null, description: 'Permanent' }]);
		mockAccountsEmailUser.mockResolvedValueOnce(null);

		// Act
		await complete.call(mockAPIContext, apiData);

		// Assert
		expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
			user: constants.accUserId,
			subject: 'Suspension of Your Account',
		}));
	});

	test('should complete UT with no action', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '1',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		// no action-specific queries
		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup (post/thread always queries)
		// no action-specific queries
		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api, params]) =>
			api === 'v1/notification/create' && params.type === constants.notification.types.ticketProcessed,
		);

		expect(notificationCall).toBeTruthy();
	});

	test('should complete UT with lock thread action', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '4',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'thread', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // lock update

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should complete UT with move thread action', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '5',
			boardId: '200000062',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 200000062 }]); // boardId parse
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'thread', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // move update

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should complete UT with modify thread title', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			updatedContent: 'Updated Thread Title',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'thread', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // insert node_revision with title

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should complete UT with delete pattern action', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '2',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'pattern', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce(null); // update town flag_id
		mockDbQuery.mockResolvedValueOnce(null); // delete pattern

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should reset banLengthId when same as current ban', async () =>
	{
		// Arrange
		const currentBanLengthId = 3;

		const tempData = {
			...data,
			banLengthId: String(currentBanLengthId),
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce({ id: currentBanLengthId, description: '1 Week', days: 7 }); // current ban matches
		mockDbQuery.mockResolvedValueOnce([{ days: 7 }]); // ban length lookup

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // modify post

		// no ban length INSERT — banLengthId was reset to 0

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);

		// Assert — no ban length INSERT should have fired
		const banInsertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_ban_length'),
		);

		expect(banInsertCall).toBeFalsy();
	});

	test('should swallow errors during delete action', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			actionId: '2',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.open, type_identifier: 'pattern', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockRejectedValueOnce(new Error('DB error during delete')); // delete fails

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act — should not throw despite delete error
		await complete.call(mockAPIContext, apiData);
	});

	test('should allow completing UT in inProgress status', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.inProgress, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // modify post

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});

	test('should allow completing UT in inDiscussion status', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.ruleId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.violationId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(complete.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.id, assignee_id: mockAPIContext.userId, status: constants.userTicket.statuses.inDiscussion, type_identifier: 'post', reference_id: 483748, violator_id: constants.accUserId }]);
		mockAPIContext.query.mockResolvedValueOnce(actions);
		mockAPIContext.query.mockResolvedValueOnce(null); // no current ban

		mockDbQuery.mockResolvedValueOnce([{ node_id: 48573, content_format: 'markdown' }]); // node lookup
		mockDbQuery.mockResolvedValueOnce(null); // modify post

		mockDbQuery.mockResolvedValueOnce([{ id: 4 }]); // status lookup
		mockDbQuery.mockResolvedValueOnce(null); // update ticket
		mockAPIContext.query.mockResolvedValueOnce(null); // notification

		// Act
		await complete.call(mockAPIContext, apiData);
	});
});
