import { describe, test, expect, vi } from 'vitest';

import adopt from 'server/api/v1/scout_hub/adopt';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockAppContext, mockDbQuery } from 'tests/vitest.setup.ts';
import * as db from '@db';

const data = {
	adopteeId: '50493',
	scoutId: '3847',
};

const expectedAPIData = {
	adopteeId: 50493,
	scoutId: 3847,
};

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const signupDate = yesterday.toISOString();

describe('adopt API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, data);

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
		await expect(APIPerms.check.call(tempAPIContext, adopt.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if user is not new member', async () =>
	{
		// Arrange
		const oneMonthIn = new Date();
		oneMonthIn.setDate(oneMonthIn.getDate() - 32);

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: oneMonthIn.toISOString() });

		// Act & Assert
		await expect(adopt.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('ineligible-adoption'));
	});

	test('should throw error if user is already adopted', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([{ id: 48372 }]);

		// Act & Assert
		await expect(adopt.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('already-adopted'));
	});

	test('should adopt user', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: `Hi there! My name is **ScoutName**. But feel free to call me **David**.

Welcome to ACC, **AdopteeName**! It may seem confusing at first, but I am here to help. If you happen to have any questions about the site, or any of the Animal Crossing games, feel free to use this private thread to ask your questions.

Just one more thing, the other Scouts and I run a Buddy Thread (kind of like a chat room) that is exclusively for all of our adoptees. This will give you the chance to meet other new members, discuss any questions that you may have, and possibly find a new friend or a WiFi buddy! You should automatically be added to it and can access it in your site menu. If you are having trouble accessing the Buddy Thread though, please do let me know.

You will have a great time on ACC.

ScoutName
ACC Scout`, welcomeTemplateFormat: 'markdown' });

			return await operate(mockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });
	});

	test('should adopt user if no previous adoptions', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: `Hi there! My name is **ScoutName**. But feel free to call me **David**.

Welcome to ACC, **AdopteeName**! It may seem confusing at first, but I am here to help. If you happen to have any questions about the site, or any of the Animal Crossing games, feel free to use this private thread to ask your questions.

Just one more thing, the other Scouts and I run a Buddy Thread (kind of like a chat room) that is exclusively for all of our adoptees. This will give you the chance to meet other new members, discuss any questions that you may have, and possibly find a new friend or a WiFi buddy! You should automatically be added to it and can access it in your site menu. If you are having trouble accessing the Buddy Thread though, please do let me know.

You will have a great time on ACC.

ScoutName
ACC Scout`, welcomeTemplateFormat: 'markdown' });

			return await operate(mockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });
	});

	test('should throw error if user cannot reassign user', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(adopt.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should reassign adoptee', async () =>
	{
		// Arrange
		const threadId = 84938;
		const adopteeUsername = 'ACC';
		const scoutUsername = 'test-developer';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce({ id: apiData.adopteeId, username: adopteeUsername, signupDate: signupDate });
		mockAPIContext.query.mockResolvedValueOnce({ id: apiData.scoutId, username: scoutUsername });

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: `Hi there! My name is **ScoutName**. But feel free to call me **David**.

Welcome to ACC, **AdopteeName**! It may seem confusing at first, but I am here to help. If you happen to have any questions about the site, or any of the Animal Crossing games, feel free to use this private thread to ask your questions.

Just one more thing, the other Scouts and I run a Buddy Thread (kind of like a chat room) that is exclusively for all of our adoptees. This will give you the chance to meet other new members, discuss any questions that you may have, and possibly find a new friend or a WiFi buddy! You should automatically be added to it and can access it in your site menu. If you are having trouble accessing the Buddy Thread though, please do let me know.

You will have a great time on ACC.

ScoutName
ACC Scout`, welcomeTemplateFormat: 'markdown' });

			return await operate(mockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });
	});

	test('should use default welcome template when scout has none', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: null, welcomeTemplateFormat: null });

			return await operate(mockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });
	});

	test('should use plaintext format when scout has no format set', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: 'Hello!', welcomeTemplateFormat: null });

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });

		// Verify the post revision INSERT uses 'plaintext' format
		const postRevisionCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO node_revision') && sql.includes('content_format'),
		);

		expect(postRevisionCall).toBeTruthy();
		expect(postRevisionCall![4]).toEqual('plaintext');
	});

	test('should replace template variables in welcome message', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';
		const adopteeUsername = mockAppContext.session!.username;

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: adopteeUsername, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: 'Hello AdopteeName! I am ScoutName.', welcomeTemplateFormat: 'plaintext' });

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });

		// Verify the post content has replaced variables
		const postRevisionCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO node_revision') && sql.includes('content_format'),
		);

		expect(postRevisionCall).toBeTruthy();
		expect(postRevisionCall![3]).toContain(adopteeUsername);
		expect(postRevisionCall![3]).toContain(scoutUsername);
		expect(postRevisionCall![3]).not.toContain('AdopteeName');
		expect(postRevisionCall![3]).not.toContain('ScoutName');
	});

	test('should skip locking old thread when reassigning with no previous adoption', async () =>
	{
		// Arrange
		const threadId = 84938;
		const adopteeUsername = 'ACC';
		const scoutUsername = 'test-developer';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true); // reassign permission
		mockAPIContext.query.mockResolvedValueOnce({ id: apiData.adopteeId, username: adopteeUsername, signupDate: signupDate });
		mockAPIContext.query.mockResolvedValueOnce({ id: apiData.scoutId, username: scoutUsername });

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([]) // no previous adoption
				// no lock query — skipped
				.mockResolvedValueOnce([{ id: threadId }]) // create thread
				.mockResolvedValueOnce([]) // thread revision
				.mockResolvedValueOnce([]) // delete old adoption
				.mockResolvedValueOnce([{ id: 48594 }]) // create post
				.mockResolvedValueOnce([]) // post revision
				.mockResolvedValueOnce([]) // permissions
				.mockResolvedValueOnce([]) // adoption record
				.mockResolvedValueOnce([]); // buddy thread perms

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: 'Hello!', welcomeTemplateFormat: 'markdown' });

			return await operate(transactionMockQuery);
		});

		// Act
		const result = await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: threadId });

		// Verify no UPDATE ... SET locked query was called
		const lockCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE node') && sql.includes('locked'),
		);

		expect(lockCall).toBeFalsy();
	});

	test('should send scoutAdoption notification after adoption', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: 'Hello!', welcomeTemplateFormat: 'markdown' });

			return await operate(mockQuery);
		});

		// Act
		await adopt.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api, params]) =>
			api === 'v1/notification/create' && params.type === constants.notification.types.scoutAdoption,
		);

		expect(notificationCall).toBeTruthy();
		expect(notificationCall![1].id).toEqual(threadId);
	});

	test('should call updateThreadStats after adoption', async () =>
	{
		// Arrange
		const threadId = 84938;
		const scoutUsername = 'ACC';

		const apiData = await APITypes.parse.bind(mockAPIContext)(adopt.apiTypes, {});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: mockAppContext.session!.username, signupDate: signupDate });
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId, username: scoutUsername }]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const updateThreadStatsSpy = vi.spyOn(db, 'updateThreadStats').mockResolvedValueOnce(undefined as any);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: threadId }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([{ id: 48594 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			mockAPIContext.query.mockResolvedValueOnce({ welcomeTemplate: 'Hello!', welcomeTemplateFormat: 'markdown' });

			return await operate(mockQuery);
		});

		// Act
		await adopt.call(mockAPIContext, apiData);

		// Assert
		expect(updateThreadStatsSpy).toHaveBeenCalledWith(threadId);

		updateThreadStatsSpy.mockRestore();
	});
});
