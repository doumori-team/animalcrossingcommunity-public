import { describe, test, expect, vi } from 'vitest';
import webpush from 'web-push';

import create from 'server/api/v1/notification/create';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockAppContext, mockAccountsEmailUser } from 'tests/vitest.setup.ts';
import { constants, utils } from '@utils';

const data = {
	id: 9584,
	type: constants.notification.types.PT,
};

const expectedAPIData = {
	id: 9584,
	type: 'private_thread',
};

const notificationTypeId = 58473;

describe('create API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
			fullQuery: vi.fn(),
		};

		// Act & Assert
		await expect(APIPerms.check.call(tempAPIContext, create.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if notification type does not exist', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: 'Random Type',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('types.PT', () =>
	{
		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});

		test('should notify users when sending PT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on PT '${title}'`);
			expect(insertCall![5]).toEqual(null);
		});

		test('should do nothing if no users to notify', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.FT', () =>
	{
		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FT,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});

		test('should notify users when posting on FT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FT,
			};

			const title = 'Random FT';
			const flaggedThreadId = 5893;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: flaggedThreadId,
				user_id: mockAPIContext.userId,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: constants.boardIds.siteSupport,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(flaggedThreadId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on thread '${title}'`);
			expect(insertCall![5]).toEqual(null);
		});

		test('should notify users with edit description when editing post on FT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FT_edit,
			};

			const title = 'Random FT';
			const flaggedThreadId = 5893;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: flaggedThreadId,
				user_id: mockAPIContext.userId,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: constants.boardIds.siteSupport,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(flaggedThreadId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has edited a post on thread '${title}'`);
			expect(insertCall![5]).toEqual(tempData.id);
		});
	});

	describe('types.FB', () =>
	{
		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FB,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});

		test('should notify users when posting on FB', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FB,
			};

			const title = 'Random Thread';
			const boardTitle = 'Site Support';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: constants.boardIds.siteSupport,
				user_id: mockAPIContext.userId,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: constants.boardIds.accForums,
				title: boardTitle,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.boardIds.accForums, type: 'board' }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(constants.boardIds.siteSupport);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has created '${title}' on board '${boardTitle}'`);
			expect(insertCall![5]).toEqual(tempData.id);
		});

		test('should notify users when posting on FB (one layer deep)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.FB,
			};

			const title = 'Random Thread';
			const acgcTradingBoardId = 200000055;
			const boardTitle = 'AC:GC Trading';
			const testDeveloperId = 11;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: acgcTradingBoardId,
				user_id: mockAPIContext.userId,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: acgcTradingBoardId,
				title: boardTitle,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ id: 300000008, type: 'board' }]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: testDeveloperId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId, testDeveloperId ]);
			expect(insertCall![2]).toEqual(acgcTradingBoardId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has created '${title}' on board '${boardTitle}'`);
			expect(insertCall![5]).toEqual(tempData.id);
		});
	});

	describe('types.usernameTag', () =>
	{
		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});

		test('should notify user when tagging them', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const title = 'Random Thread';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: `Hi @ACC!`,
				parent_node_id: 58493,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ title: title }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has tagged you in thread '${title}'`);
		});

		test('should notify users when tagging them', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const title = 'Random Thread';
			const testDeveloperUserId = 11;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: `Hi @ACC! Hello @test-developer!`,
				parent_node_id: 58493,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				id: testDeveloperUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ title: title }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId, testDeveloperUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has tagged you in thread '${title}'`);
		});

		test('should not notify user with false call', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: `Hi ACC!`,
				parent_node_id: 58493,
				title: null,
			}]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});

		test('should not notify self when tagging', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: `Hi @test-user!`,
				parent_node_id: 58493,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				id: mockAPIContext.userId,
			}]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.announcement', () =>
	{
		test('should notify all users when creating announcement', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.announcement,
			};

			const title = 'Random Announcement';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: constants.boardIds.announcements,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO global_notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual(tempData.id);
			expect(insertCall![2]).toEqual(notificationTypeId);
			expect(insertCall![3]).toEqual(`A new announcement has been posted: '${title}'`);
		});

		test('should email users when creating announcement', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.announcement,
			};

			const title = 'Random Announcement';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: null,
				parent_node_id: constants.boardIds.announcements,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockAccountsEmailUser.mockResolvedValueOnce(null);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
				user: constants.accUserId,
				subject: 'Notification: ' + `A new announcement has been posted: '${title}'`,
			}));
		});
	});

	test('should notify listing user when making an offer', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.listingOffer,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
		mockAPIContext.query.mockResolvedValueOnce({ creator: { id: constants.accUserId } });
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has submitted an offer on your listing`);
	});

	test('should notify listing user when cancelling an offer', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.listingOfferCancelled,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
		mockAPIContext.query.mockResolvedValueOnce({ creator: { id: constants.accUserId } });
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has cancelled their offer`);
	});

	describe('types.listingOfferRejected', () =>
	{
		test('should notify offer user when offer is rejected', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingOfferRejected,
			};

			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has rejected your offer`);
		});

		test('should throw error if offer not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingOfferRejected,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-offer'));
		});
	});

	describe('types.listingOfferAccepted', () =>
	{
		test('should notify offer user when offer is accepted', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingOfferAccepted,
			};

			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has accepted your offer`);
		});

		test('should throw error if offer not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingOfferAccepted,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-offer'));
		});
	});

	describe('types.listingComment', () =>
	{
		test('should notify users when comment is posted by third party', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingComment,
			};

			const testDeveloperId = 11;
			const testResearcherId = 12;
			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: mockAPIContext.userId }]);
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: testDeveloperId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
					list: [ { user: { id: testResearcherId }, status: constants.tradingPost.offerStatuses.pending } ],
				},
			});
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ testDeveloperId, constants.accUserId, testResearcherId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has commented on a trade`);
		});

		test('should throw error if comment not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingComment,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should notify users when comment is posted by listing creator', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingComment,
			};

			const testDeveloperId = 11;
			const testDeveloperUsername = 'test-developer';
			const testResearcherId = 12;
			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: testDeveloperId, username: testDeveloperUsername, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: testDeveloperId }]);
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: testDeveloperId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
					list: [ { user: { id: testResearcherId }, status: constants.tradingPost.offerStatuses.pending } ],
				},
			});
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId, testResearcherId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${testDeveloperUsername} has commented on a trade`);
		});

		test('should notify users when comment is posted by listing offer accepted user', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingComment,
			};

			const testDeveloperId = 11;
			const testResearcherId = 12;
			const accUserUsername = 'ACC';
			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserUsername, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: constants.accUserId }]);
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: testDeveloperId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
					list: [ { user: { id: testResearcherId }, status: constants.tradingPost.offerStatuses.pending } ],
				},
			});
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ testDeveloperId, testResearcherId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserUsername} has commented on a trade`);
		});

		test('should notify users when comment is posted by listing offer pending', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingComment,
			};

			const testDeveloperId = 11;
			const testResearcherId = 12;
			const testResearcherUsername = 'test-researcher';
			const listingId = 5849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: testResearcherId, username: testResearcherUsername, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ listing_id: listingId, user_id: testResearcherId }]);
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: testDeveloperId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
					list: [ { user: { id: testResearcherId }, status: constants.tradingPost.offerStatuses.pending } ],
				},
			});
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ testDeveloperId, constants.accUserId ]);
			expect(insertCall![2]).toEqual(listingId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${testResearcherUsername} has commented on a trade`);
		});
	});

	test('should notify users when listing is cancelled', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.listingCancelled,
		};

		const testDeveloperId = 11;

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
		mockAPIContext.query.mockResolvedValueOnce({
			creator: { id: mockAPIContext.userId },
			offers: {
				accepted: { user: { id: constants.accUserId } },
				list: [ { user: { id: testDeveloperId }, status: constants.tradingPost.offerStatuses.pending } ],
			},
		});
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId, testDeveloperId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has cancelled the listing`);
	});

	describe('types.listingContact', () =>
	{
		test('should notify users when contact is given (listing creator)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingContact,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has submitted contact information on a trade`);
		});

		test('should notify users when contact is given (listing offer accepted)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingContact,
			};

			const accUserName = 'ACC';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserName} has submitted contact information on a trade`);
		});
	});

	describe('types.listingFailed', () =>
	{
		test('should notify users when listing is marked as failed (listing creator)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingFailed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has marked the trade as failed`);
		});

		test('should notify users when listing is marked as failed (listing offer accepted)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingFailed,
			};

			const accUserName = 'ACC';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserName} has marked the trade as failed`);
		});
	});

	describe('types.listingCompleted', () =>
	{
		test('should notify users when listing is marked as completed (listing creator)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingCompleted,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has marked the trade as completed`);
		});

		test('should notify users when listing is marked as completed (listing offer accepted)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingCompleted,
			};

			const accUserName = 'ACC';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserName} has marked the trade as completed`);
		});
	});

	describe('types.listingFeedback', () =>
	{
		test('should notify users when listing has been given feedback (listing creator)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingFeedback,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has given feedback on a trade`);
		});

		test('should notify users when listing has been given feedback (listing offer accepted)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.listingFeedback,
			};

			const accUserName = 'ACC';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.groupIdentifiers.user } });
			mockAPIContext.query.mockResolvedValueOnce({
				creator: { id: mockAPIContext.userId },
				offers: {
					accepted: { user: { id: constants.accUserId } },
				},
			});
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserName} has given feedback on a trade`);
		});
	});

	describe('types.scoutAdoption', () =>
	{
		test('should notify scout when user is adopted', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.scoutAdoption,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ scout_id: constants.accUserId, adoptee_id: mockAPIContext.userId, adoptee: mockAppContext.session!.username }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`You've adopted ${mockAppContext.session!.username}`);
		});

		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.scoutAdoption,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});
	});

	describe('types.scoutThread', () =>
	{
		test('should notify scout when user posts on adoptee thread', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.scoutThread,
			};

			const adopteeThreadId = 48372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ parent_node_id: adopteeThreadId, user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ scout_id: constants.accUserId, adoptee_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(adopteeThreadId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on the Adoptee Thread`);
		});

		test('should notify user when scout posts on adoptee thread', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.scoutThread,
			};

			const adopteeThreadId = 48372;
			const accUserName = 'ACC';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.staffIdentifiers.scout } });
			mockDbQuery.mockResolvedValueOnce([{ parent_node_id: adopteeThreadId, user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([{ scout_id: constants.accUserId, adoptee_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ mockAPIContext.userId ]);
			expect(insertCall![2]).toEqual(adopteeThreadId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${accUserName} has posted on the Adoptee Thread`);
		});

		test('should throw error if node not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.scoutThread,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});
	});

	test('should notify scouts, users, when posting on Adoptee BT', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.scoutBT,
		};

		const adopteeThreadId = 48372;
		const accUserName = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: constants.accUserId, username: accUserName, group: { identifier: constants.staffIdentifiers.scout } });
		mockDbQuery.mockResolvedValueOnce([{ parent_node_id: adopteeThreadId, user_id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ mockAPIContext.userId ]);
		expect(insertCall![2]).toEqual(adopteeThreadId);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${accUserName} has posted on the Adoptee BT`);
	});

	test('should notify scout when user gives feedback', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.scoutFeedback,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
		mockDbQuery.mockResolvedValueOnce([{ scout_id: constants.accUserId, adoptee_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has submitted scout feedback`);
	});

	test('should throw error if scout closed Adoptee Thread', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.scoutClosed,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if listing is expired', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.listingExpired,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if support email imported', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.supportEmail,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error for donation reminder', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.donationReminder,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('types.modminUT', () =>
	{
		test('should notify mods when new UT comes in', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUT,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: null, identifier: null, status: constants.userTicket.statuses.open, violator_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has submitted a UT`);
		});

		test('should throw error if UT not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUT,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user-ticket'));
		});
	});

	describe('types.modminUTMany', () =>
	{
		test('should notify modmins when many people report the same content', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTMany,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ count: 6 }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`5+ people have submitted the same UT`);
		});

		test('should do nothing if many people have not reported the same content', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUT,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user-ticket'));
		});
	});

	test('should notify modmins when UT goes into discussion', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.modminUTDiscussion,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
		mockDbQuery.mockResolvedValueOnce([{ assignee_id: mockAPIContext.userId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.inDiscussion, violator_id: 59483 }]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId },{ id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has moved a UT to discussion`);
	});

	describe('types.modminUTPost', () =>
	{
		test('should notify modmins when new modmin post on UT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.staffIdentifiers.mod, staff_only: true }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: mockAPIContext.userId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.open, violator_id: 95837 }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId },{ id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId, mockAPIContext.userId ]);
			expect(insertCall![2]).toEqual(userTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on a UT`);
		});

		test('should throw error if UT message not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should notify modmin when user post on UT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.groupIdentifiers.user, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: constants.accUserId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.open, violator_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(userTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on a UT`);
		});

		test('should notify modmins when user post on UT assigned to an ex-modmin', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.groupIdentifiers.user, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: 958493, identifier: constants.groupIdentifiers.user, status: constants.userTicket.statuses.open, violator_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(userTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on a UT`);
		});

		test('should notify user when modmin posts, sending UT back to user', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.staffIdentifiers.mod, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: mockAPIContext.userId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.closed, violator_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(userTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`You have received a new notification from the staff`);
		});
	});

	describe('types.ticketProcessed', () =>
	{
		test('should notify user when UT is processed', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.ticketProcessed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ violator_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`You have received a new notification from the staff`);
		});

		test('should throw error if UT not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.ticketProcessed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-user-ticket'));
		});
	});

	describe('types.supportTicketProcessed', () =>
	{
		test('should notify user when ST is processed', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicketProcessed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`You have received a new notification from the staff`);
		});

		test('should throw error if ST not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicketProcessed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-support-ticket'));
		});

		test('should notify modmins when user creates ST', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicketProcessed,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on a ST`);
		});
	});

	describe('types.supportTicket', () =>
	{
		test('should notify user when ST has new message', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicket,
			};

			const supportTicketId = 83729;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ support_ticket_id: supportTicketId, identifier: constants.staffIdentifiers.mod, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(supportTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`You have received a new notification from the staff`);
		});

		test('should throw error if ST message not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicket,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should notify modmin when ST has new message', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicket,
			};

			const supportTicketId = 83729;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ support_ticket_id: supportTicketId, identifier: constants.groupIdentifiers.user, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(supportTicketId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on a ST`);
		});

		test('should do nothing if modmins posts staff only message', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.supportTicket,
			};

			const supportTicketId = 83729;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ support_ticket_id: supportTicketId, identifier: constants.staffIdentifiers.mod, staff_only: true }]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.feature', () =>
	{
		test('should notify staff when feature created', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.feature,
			};

			const title = 'Random Feature';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ title: title, created_user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has created feature '${title}'`);
		});

		test('should throw error if feature not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.feature,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-feature'));
		});
	});

	test('should notify followers when feature updated', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.followFeature,
		};

		const title = 'Random Feature';

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
		mockDbQuery.mockResolvedValueOnce([{ title: title, created_user_id: mockAPIContext.userId }]);
		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		await create.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual([ constants.accUserId ]);
		expect(insertCall![2]).toEqual(tempData.id);
		expect(insertCall![3]).toEqual(notificationTypeId);
		expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has updated feature '${title}'`);
	});

	describe('types.featurePost', () =>
	{
		test('should notify followers when feature is posted on', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.featurePost,
			};

			const title = 'Random Feature';
			const featureId = 38473;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ feature_id: featureId, user_id: mockAPIContext.userId, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ title: title, created_user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(featureId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on feature '${title}'`);
		});

		test('should notify staff when feature is posted on (staff only)', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.featurePost,
			};

			const title = 'Random Feature';
			const featureId = 38473;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ feature_id: featureId, user_id: mockAPIContext.userId, staff_only: true }]);
			mockDbQuery.mockResolvedValueOnce([{ title: title, created_user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(featureId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on feature '${title}'`);
		});

		test('should throw error if feature message not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.featurePost,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('types.giftBellShop', () =>
	{
		test('should notify user when another gifts them', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftBellShop,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, redeemed_by: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has gifted you an item from the Bell Shop`);
		});

		test('should throw error if gift not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftBellShop,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should do nothing if user buys for themself', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftBellShop,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, redeemed_by: mockAPIContext.userId }]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.giftDonation', () =>
	{
		test('should notify user when another donates for them', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftDonation,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, donated_by_user_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has donated on your behalf`);
		});

		test('should throw error if donation not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftDonation,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should do nothing if donates for themself', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.giftDonation,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, donated_by_user_id: mockAPIContext.userId }]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.shopThread', () =>
	{
		test('should notify shop people when contacted', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopThread,
			};

			const title = 'Random Title';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ title: title }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has sent you a new Shop Thread: '${title}'`);
		});

		test('should notify users when shop thread is posted on', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopThread,
			};

			const title = 'Random Title';
			const shopThreadId = 39483;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce([{ parent_node_id: shopThreadId, title: title }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(shopThreadId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has posted on Shop Thread '${title}'`);
		});

		test('should throw error if neither node found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopThread,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-node'));
		});
	});

	describe('types.shopEmployee', () =>
	{
		test('should notify user when they are added to shop', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopEmployee,
			};

			const shopName = 'Random Shop';
			const shopId = 32849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ shop_id: shopId, active: true, name: shopName, user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(shopId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has added you to their Shop '${shopName}'`);
		});

		test('should notify user when they are removed from shop', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopEmployee,
			};

			const shopName = 'Random Shop';
			const shopId = 32849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ shop_id: shopId, active: false, name: shopName, user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(shopId);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has removed you from their Shop '${shopName}'`);
		});

		test('should throw error if shop not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopEmployee,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-shop'));
		});
	});

	describe('types.shopOrder', () =>
	{
		test('should notify shop employees when new order comes in', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopOrder,
			};

			const shopName = 'Random Shop';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ name: shopName }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has put in a new order for '${shopName}'`);
		});

		test('should throw error if order not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopOrder,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-order'));
		});
	});

	describe('types.shopApplication', () =>
	{
		test('should notify shop employees when new application comes in', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopApplication,
			};

			const shopName = 'Random Shop';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ name: shopName }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has applied to '${shopName}'`);
		});

		test('should throw error if application not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.shopApplication,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-application'));
		});
	});

	describe('email notification', () =>
	{
		describe('types.PT', () =>
		{
			test('should email if user never looked at PT', async () =>
			{
				// Arrange
				const tempData = {
					...data,
					type: constants.notification.types.PT,
				};

				const title = 'Random PT';
				const threadId = 94839;

				const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

				mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
				mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
				mockDbQuery.mockResolvedValueOnce([{
					parent_node_id: threadId,
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					content: 'Random Content',
					parent_node_id: constants.boardIds.privateThreads,
					title: title,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					user_id: constants.accUserId,
				}, {
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([]);
				mockDbQuery.mockResolvedValueOnce(null);
				mockDbQuery.mockResolvedValueOnce([{
					id: constants.accUserId,
					email_notifications: true,
					subscription: null,
				}]);
				mockAPIContext.fullQuery.mockResolvedValueOnce(true);
				mockDbQuery.mockResolvedValueOnce([]);

				const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

				mockAccountsEmailUser.mockResolvedValueOnce(null);

				// Act
				await create.call(mockAPIContext, apiData);

				// Assert
				expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
					user: constants.accUserId,
					subject: 'Notification: ' + `${mockAppContext.session!.username} has posted on PT '${title}'`,
				}));

				expect(spy.mock.results[0].value).toEqual(`/forums/${threadId}/1`);
			});

			test('should email if user looked at PT', async () =>
			{
				// Arrange
				const tempData = {
					...data,
					type: constants.notification.types.PT,
				};

				const title = 'Random PT';
				const threadId = 8493;
				const lastPostId = 48594;
				const now = new Date();

				const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

				mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
				mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
				mockDbQuery.mockResolvedValueOnce([{
					parent_node_id: threadId,
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					content: 'Random Content',
					parent_node_id: constants.boardIds.privateThreads,
					title: title,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					user_id: constants.accUserId,
				}, {
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([]);
				mockDbQuery.mockResolvedValueOnce(null);
				mockDbQuery.mockResolvedValueOnce([{
					id: constants.accUserId,
					email_notifications: true,
					subscription: null,
				}]);
				mockAPIContext.fullQuery.mockResolvedValueOnce(true);
				mockDbQuery.mockResolvedValueOnce([{ last_checked: new Date(now.getTime() - 5 * 60 * 1000).toISOString() }]);
				mockDbQuery.mockResolvedValueOnce([
					{ id: 485948, creation_time: new Date(now.getTime() - 6 * 60 * 1000).toISOString() },
					{ id: lastPostId, creation_time: new Date(now.getTime() - 4 * 60 * 1000).toISOString() },
				]);

				const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

				mockAccountsEmailUser.mockResolvedValueOnce(null);

				// Act
				await create.call(mockAPIContext, apiData);

				// Assert
				expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
					user: constants.accUserId,
					subject: 'Notification: ' + `${mockAppContext.session!.username} has posted on PT '${title}'`,
				}));

				expect(spy.mock.results[0].value).toEqual(`/forums/${threadId}/1#${lastPostId}`);
			});

			test('should email if user looked at PT on last page', async () =>
			{
				// Arrange
				const tempData = {
					...data,
					type: constants.notification.types.PT,
				};

				const title = 'Random PT';
				const threadId = 39483;
				const lastPostId = 48594;
				const now = new Date();
				const lastChecked = new Date(now.getTime() - 1 * 60 * 1000).toISOString();

				const oldPosts = Array.from({ length: constants.threadPageSize }, (_, i) => ({
					id: 1000 + i,
					creation_time: new Date(now.getTime() - 2 * 60 * 1000 - i * 1000).toISOString(),
				}));

				const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

				mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
				mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
				mockDbQuery.mockResolvedValueOnce([{
					parent_node_id: threadId,
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					content: 'Random Content',
					parent_node_id: constants.boardIds.privateThreads,
					title: title,
				}]);
				mockDbQuery.mockResolvedValueOnce([{
					user_id: constants.accUserId,
				}, {
					user_id: mockAPIContext.userId,
				}]);
				mockDbQuery.mockResolvedValueOnce([]);
				mockDbQuery.mockResolvedValueOnce(null);
				mockDbQuery.mockResolvedValueOnce([{
					id: constants.accUserId,
					email_notifications: true,
					subscription: null,
				}]);
				mockAPIContext.fullQuery.mockResolvedValueOnce(true);
				mockDbQuery.mockResolvedValueOnce([{ last_checked: lastChecked }]);
				mockDbQuery.mockResolvedValueOnce([
					...oldPosts,
					{ id: lastPostId, creation_time: new Date(now.getTime()).toISOString() },
				]);

				const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

				mockAccountsEmailUser.mockResolvedValueOnce(null);

				// Act
				await create.call(mockAPIContext, apiData);

				// Assert
				expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
					user: constants.accUserId,
					subject: 'Notification: ' + `${mockAppContext.session!.username} has posted on PT '${title}'`,
				}));

				expect(spy.mock.results[0].value).toEqual(`/forums/${threadId}/2#${lastPostId}`);
			});
		});

		test('should email user when tagged', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.usernameTag,
			};

			const title = 'Random Thread';
			const threadId = 95849;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: `Hi @ACC!`,
				parent_node_id: 58493,
				title: null,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ title: title }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
				email_notifications: true,
				subscription: null,
			}]);
			mockAPIContext.fullQuery.mockResolvedValueOnce(true);
			mockDbQuery.mockResolvedValueOnce([{ id: threadId }]);
			mockDbQuery.mockResolvedValueOnce([
				{ id: 485948 },
				{ id: tempData.id },
			]);

			const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

			mockAccountsEmailUser.mockResolvedValueOnce(null);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
				user: constants.accUserId,
				subject: 'Notification: ' + `${mockAppContext.session!.username} has tagged you in thread '${title}'`,
			}));

			expect(spy.mock.results[0].value).toEqual(`/forums/${threadId}/1#${tempData.id}`);
		});

		test('should email modmins when new modmin post on UT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.staffIdentifiers.mod } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.staffIdentifiers.mod, staff_only: true }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: mockAPIContext.userId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.open, violator_id: 95837 }]);
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId },{ id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
				email_notifications: true,
				subscription: null,
			}]);
			mockAPIContext.fullQuery.mockResolvedValueOnce(true);
			mockDbQuery.mockResolvedValueOnce([{}]);

			const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

			mockAccountsEmailUser.mockResolvedValueOnce(null);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
				user: constants.accUserId,
				subject: 'Notification: ' + `${mockAppContext.session!.username} has posted on a UT`,
			}));

			expect(spy.mock.results[0].value).toEqual(`/user-ticket/${userTicketId}`);
		});

		test('should notify modmin when user post on UT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.modminUTPost,
			};

			const userTicketId = 58372;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ user_ticket_id: userTicketId, identifier: constants.groupIdentifiers.user, staff_only: false }]);
			mockDbQuery.mockResolvedValueOnce([{ assignee_id: constants.accUserId, identifier: constants.staffIdentifiers.mod, status: constants.userTicket.statuses.open, violator_id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
				email_notifications: true,
				subscription: null,
			}]);
			mockAPIContext.fullQuery.mockResolvedValueOnce(true);
			mockDbQuery.mockResolvedValueOnce([]);

			const spy = vi.spyOn(utils, 'getNotificationReferenceLink');

			mockAccountsEmailUser.mockResolvedValueOnce(null);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
				user: constants.accUserId,
				subject: 'Notification: ' + `${mockAppContext.session!.username} has posted on a UT`,
			}));

			expect(spy.mock.results[0].value).toEqual(`/ticket/${userTicketId}`);
		});
	});

	describe('types.badge', () =>
	{
		test('should notify user when badge is earned', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.badge,
			};

			const badgeName = 'Bug Reporter';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, name: badgeName }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ mockAPIContext.userId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`Congrats! You have earned the badge: '${badgeName}'`);
		});

		test('should throw error if badge not found', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.badge,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-badge'));
		});
	});

	describe('types.postQuote', () =>
	{
		test('should notify quoted users', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.postQuote,
			};

			const title = 'Random Thread';
			const nodeRevisionId = 84739;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Some reply text',
				parent_node_id: 58493,
				title: null,
				node_revision_id: nodeRevisionId,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([{ title: title }]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has quoted you in thread '${title}'`);
		});

		test('should do nothing if no quoted users', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.postQuote,
			};

			const nodeRevisionId = 84739;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Some reply text',
				parent_node_id: 58493,
				title: null,
				node_revision_id: nodeRevisionId,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]); // no quoted users

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	describe('types.postReaction', () =>
	{
		test('should notify post owner when reacted to', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.postReaction,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Some post text',
				parent_node_id: 58493,
				title: null,
				node_revision_id: 84739,
				user_id: constants.accUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ disable_post_reaction_notifications: false }]);
			mockDbQuery.mockResolvedValueOnce([]); // existing notifications check
			mockDbQuery.mockResolvedValueOnce(null); // insert notification
			mockDbQuery.mockResolvedValueOnce([]); // account settings

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeTruthy();
			expect(insertCall![1]).toEqual([ constants.accUserId ]);
			expect(insertCall![2]).toEqual(tempData.id);
			expect(insertCall![3]).toEqual(notificationTypeId);
			expect(insertCall![4]).toEqual(`${mockAppContext.session!.username} has reacted to post`);
		});

		test('should do nothing if user disabled reaction notifications', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.postReaction,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Some post text',
				parent_node_id: 58493,
				title: null,
				node_revision_id: 84739,
				user_id: constants.accUserId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{ disable_post_reaction_notifications: true }]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});

		test('should do nothing if reacting to own post', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.postReaction,
			};

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Some post text',
				parent_node_id: 58493,
				title: null,
				node_revision_id: 84739,
				user_id: mockAPIContext.userId,
			}]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification'),
			);

			expect(insertCall).toBeFalsy();
		});
	});

	test('should throw error for avatarCleared notification type', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			type: constants.notification.types.avatarCleared,
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('multi-description notifications', () =>
	{
		test('should increment count for existing PT notification', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			// existing notification found for this user
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			// multi-description update
			mockDbQuery.mockResolvedValueOnce(null);
			// no non-existing users to insert for
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const updateCall = mockDbQuery.mock.calls.find(([sql]) =>
				sql.includes('INSERT INTO notification') && sql.includes('ON CONFLICT') && sql.includes('count'),
			);

			expect(updateCall).toBeTruthy();
		});

		test('should insert new and update existing notifications separately', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';
			const testDeveloperId = 11;

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: testDeveloperId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			// only one user has existing notification
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
			// update existing
			mockDbQuery.mockResolvedValueOnce(null);
			// insert for new user
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			const insertCalls = mockDbQuery.mock.calls.filter(([sql]) =>
				sql.includes('INSERT INTO notification') && sql.includes('ON CONFLICT'),
			);

			// Should have two INSERT calls: one for existing (multi), one for new
			expect(insertCalls.length).toBeGreaterThanOrEqual(2);
		});
	});

	test('should throw error if description is empty', async () =>
	{
		// Arrange — use an unknown notification type that passes the type lookup
		// but doesn't match any handler, falling through to the else
		const tempData = {
			...data,
			type: 'unknown_type_that_does_not_exist',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

		mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });

		// Act & Assert
		await expect(create.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	describe('web push notifications', () =>
	{
		test('should send web push notification to subscribed user', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';
			const subscription = JSON.stringify({ endpoint: 'https://push.example.com/test', keys: { p256dh: 'testkey', auth: 'testauthkey' } });

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
				email_notifications: false,
				subscriptions: subscription,
			}]);
			mockAPIContext.fullQuery.mockResolvedValueOnce(true); // permission check
			mockDbQuery.mockResolvedValueOnce([]); // node_user last_checked

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spy = vi.spyOn(webpush, 'sendNotification').mockResolvedValueOnce({} as any);

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(spy).toHaveBeenCalledWith(
				JSON.parse(subscription),
				expect.stringContaining(`${mockAppContext.session!.username} has posted on PT`),
			);

			spy.mockRestore();
		});
	});

	describe('email notification permission check', () =>
	{
		test('should skip email when user lacks read permission on PT', async () =>
		{
			// Arrange
			const tempData = {
				...data,
				type: constants.notification.types.PT,
			};

			const title = 'Random PT';

			const apiData = await APITypes.parse.bind(mockAPIContext)(create.apiTypes, tempData);

			mockDbQuery.mockResolvedValueOnce([{ id: notificationTypeId }]);
			mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, group: { identifier: constants.groupIdentifiers.user } });
			mockDbQuery.mockResolvedValueOnce([{
				parent_node_id: 9584,
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				content: 'Random Content',
				parent_node_id: constants.boardIds.privateThreads,
				title: title,
			}]);
			mockDbQuery.mockResolvedValueOnce([{
				user_id: constants.accUserId,
			}, {
				user_id: mockAPIContext.userId,
			}]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce(null);
			mockDbQuery.mockResolvedValueOnce([{
				id: constants.accUserId,
				email_notifications: true,
				subscriptions: null,
			}]);
			mockAPIContext.fullQuery.mockResolvedValueOnce(false); // no read permission

			// Act
			await create.call(mockAPIContext, apiData);

			// Assert
			expect(mockAccountsEmailUser).not.toHaveBeenCalled();
		});
	});
});
