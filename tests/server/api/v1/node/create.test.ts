import { describe, test, expect, vi } from 'vitest';

import * as create from 'server/api/v1/node/create';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockDbProfanity, mockAccountsGetData, mockAppContext } from 'tests/vitest.setup.ts';
import { constants, utils } from '@utils';
import { ProfanityError } from '@errors';
import * as db from '@db';
import { MarkupStyleType, NodeType } from '@types';

const data = {
	type: 'normal',
	parentId: '200000062',
	title: 'test',
	format: 'markdown',
	text: 'test',
	fileCaptions: 'wefewf',
	fileIds: '9c187d27-15ef-4218-88ed-591b36c75def.png',
	fileNames: 'acc_wood_square',
	fileWidths: '254',
	fileHeights: '254',
};

const expectedAPIData = {
	type: 'normal' as NodeType['threadType'],
	parentId: 200000062,
	title: 'test',
	format: 'markdown' as MarkupStyleType,
	text: 'test',
	fileCaptions: [ 'wefewf' ],
	fileIds: [ '9c187d27-15ef-4218-88ed-591b36c75def.png' ],
	fileNames: [ 'acc_wood_square' ],
	fileWidths: [ '254' ],
	fileHeights: [ '254' ],
	lock: false,
	addUsers: [],
	removeUsers: [],
	boardId: 0,
};

const parentDetails: create.ParentDetailsType = {
	id: 94839,
	type: 'thread',
	locked: null,
	parent_node_id: 493829,
	thread_type: 'normal',
	title: 'Random Title',
	parent_title: 'Random Board Title',
	user_id: 255661,
	parent_locked: null,
	parent2_id: 38293,
	parent2_parent_id: 49382,
};

describe('create API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.parentId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(create.default.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.parentId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(create.default.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(create.default.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
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
		await expect(APIPerms.check.call(tempAPIContext, create.default.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	describe('validateEditPost function', () =>
	{
		test('should throw error if editing post without permission', async () =>
		{
			// Act & Assert
			await expect(create.validateEditPost(true, false)).rejects.toThrow(new UserError('permission'));
		});
	});

	describe('validateTextTitle function', () =>
	{
		test('should throw error if changing title without permission while editing post', async () =>
		{
			// Arrange, Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'post',
				true,
				true,
				false,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if changing title without permission while creating post', async () =>
		{
			// Arrange, Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'post',
				false,
				false,
				false,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should not throw error if title with User Submission', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				parent_node_id: constants.boardIds.userSubmissions,
			};

			mockDbQuery.mockResolvedValueOnce([]);
			mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 });

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'post',
				false,
				false,
				false,
			)).resolves.not.toThrow();
		});

		test('should throw error if title has profanity', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				title: 'Random Title flower',
			};

			const error = new ProfanityError('flower');

			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]);
			mockDbProfanity.mockRejectedValueOnce(error);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'thread',
				false,
				false,
				false,
			)).rejects.toThrow(new ProfanityError('flower'));
		});

		test('should not throw error if posting new thread on staff board', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				title: 'Random Title flower',
			};

			mockDbQuery.mockResolvedValueOnce([{ id: parentDetails.id }]);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'thread',
				false,
				false,
				false,
			)).resolves.not.toThrow();
		});

		test('should not throw error if posting on thread on staff board', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				title: 'Random Title flower',
			};

			mockDbQuery.mockResolvedValueOnce([{ id: parentDetails.parent_node_id }]);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'thread',
				false,
				false,
				false,
			)).resolves.not.toThrow();
		});

		test('should not throw error if editing post on thread on staff board', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				title: 'Random Title flower',
			};

			mockDbQuery.mockResolvedValueOnce([{ id: parentDetails.parent2_parent_id }]);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'thread',
				false,
				false,
				false,
			)).resolves.not.toThrow();
		});

		test('should throw error if title has profanity (User Submissions)', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				id: constants.boardIds.userSubmissions,
				title: 'Rnadom Title flower',
			};

			const error = new ProfanityError('flower');

			mockDbQuery.mockResolvedValueOnce([{ id: constants.boardIds.userSubmissions }]);
			mockDbProfanity.mockRejectedValueOnce(error);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				tempParentDetails,
				'thread',
				false,
				false,
				false,
			)).rejects.toThrow(new ProfanityError('flower'));
		});

		test('should throw error if text has profanity', async () =>
		{
			// Arrange
			const error = new ProfanityError('flower');

			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockDbProfanity.mockRejectedValueOnce(error);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				`${expectedAPIData.text} flower`,
				parentDetails,
				'thread',
				false,
				false,
				false,
			)).rejects.toThrow(new ProfanityError('flower'));
		});

		test('should throw error if text too large (post3)', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockAPIContext.query.mockResolvedValueOnce({
				id: mockAPIContext.userId,
				donations: 0,
				perks: 0,
				monthlyPerks: 0,
			});

			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.post3 + 1);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'thread',
				false,
				true,
				false,
			)).rejects.toThrow(new UserError('bad-format'));

			// Cleanup
			spy.mockRestore();
		});

		test('should throw error if text too large (post2)', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockAPIContext.query.mockResolvedValueOnce({
				id: mockAPIContext.userId,
				donations: 0,
				perks: 0,
				monthlyPerks: 0,
			});

			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.post2 + 1);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'thread',
				false,
				true,
				false,
			)).rejects.toThrow(new UserError('bad-format'));

			// Cleanup
			spy.mockRestore();
		});

		test('should throw error if text too large (post1)', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockDbProfanity.mockResolvedValueOnce(null);
			mockAPIContext.query.mockResolvedValueOnce({
				id: mockAPIContext.userId,
				donations: 0,
				perks: 0,
				monthlyPerks: 0,
			});

			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.post1 + 1);

			// Act & Assert
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'thread',
				false,
				true,
				false,
			)).rejects.toThrow(new UserError('bad-format'));

			// Cleanup
			spy.mockRestore();
		});
	});

	describe('validateLock function', () =>
	{
		test('should throw error if locking not a thread', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				type: 'board',
			};

			// Act & Assert
			await expect(create.validateLock.call(
				mockAPIContext,
				true,
				tempParentDetails,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if locking without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateLock.call(
				mockAPIContext,
				true,
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});
	});

	describe('validateAddRemoveUsers function', () =>
	{
		test('should throw error if adding users without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateAddRemoveUsers.call(
				mockAPIContext,
				['test-user'],
				[],
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});

		test('should throw error if removing users without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateAddRemoveUsers.call(
				mockAPIContext,
				[],
				['test-user'],
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});
	});

	describe('validateThreadType function', () =>
	{
		test('should throw error if stickying without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateThreadType.call(
				mockAPIContext,
				'sticky',
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});

		test('should throw error if admin-locking without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateThreadType.call(
				mockAPIContext,
				'admin',
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});
	});

	describe('validateBoardId function', () =>
	{
		test('should throw error if moving a thread when not posting on a thread', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				type: 'board',
			};

			// Act & Assert
			await expect(create.validateBoardId.call(
				mockAPIContext,
				94839,
				tempParentDetails,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if moving a thread without permission', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(false);

			// Act & Assert
			await expect(create.validateBoardId.call(
				mockAPIContext,
				94839,
				parentDetails,
			)).rejects.toThrow(new UserError('permission'));
		});

		test('should throw error if moving a thread to a board that does not exist', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(true);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateBoardId.call(
				mockAPIContext,
				94839,
				parentDetails,
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if moving a thread to a thread', async () =>
		{
			// Arrange
			mockAPIContext.query.mockResolvedValueOnce(true);
			mockDbQuery.mockResolvedValueOnce([{ id: 48373, type: 'thread' }]);

			// Act & Assert
			await expect(create.validateBoardId.call(
				mockAPIContext,
				94839,
				parentDetails,
			)).rejects.toThrow(new UserError('bad-format'));
		});
	});

	describe('validateFileArrays function', () =>
	{
		test('should throw error if file arrays do not match each other', async () =>
		{
			// Act & Assert
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				false,
				expectedAPIData.fileIds,
				[],
				[],
				[],
				[],
			)).rejects.toThrow(new UserError('bad-format'));
		});

		test('should throw error if too many files attached', async () =>
		{
			// Act & Assert
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				false,
				Array(5).fill(expectedAPIData.fileIds[0]),
				Array(5).fill(expectedAPIData.fileNames[0]),
				Array(5).fill(expectedAPIData.fileWidths[0]),
				Array(5).fill(expectedAPIData.fileHeights[0]),
				Array(5).fill(expectedAPIData.fileCaptions[0]),
			)).rejects.toThrow(new UserError('too-many-files'));
		});

		test('should throw error if caption is too long', async () =>
		{
			// Arrange
			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.imageCaption + 1);

			// Act & Assert
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				false,
				expectedAPIData.fileIds,
				expectedAPIData.fileNames,
				expectedAPIData.fileWidths,
				expectedAPIData.fileHeights,
				expectedAPIData.fileCaptions,
			)).rejects.toThrow(new UserError('bad-format'));

			// Cleanup
			spy.mockRestore();
		});

		test('should throw error if caption is empty', async () =>
		{
			// Arrange
			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => 0);

			// Act & Assert
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				false,
				expectedAPIData.fileIds,
				expectedAPIData.fileNames,
				expectedAPIData.fileWidths,
				expectedAPIData.fileHeights,
				expectedAPIData.fileCaptions,
			)).rejects.toThrow(new UserError('bad-format'));

			// Cleanup
			spy.mockRestore();
		});

		test('should throw error if uploading as a new member', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			mockAPIContext.query.mockResolvedValueOnce({ signupDate: yesterday.toISOString() });

			// Act & Assert
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				false,
				expectedAPIData.fileIds,
				expectedAPIData.fileNames,
				expectedAPIData.fileWidths,
				expectedAPIData.fileHeights,
				expectedAPIData.fileCaptions,
			)).rejects.toThrow(new UserError('permission'));
		});
	});

	describe('validateServerSide function', () =>
	{
		test('should throw error if title is empty when creating a thread', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				'',
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('missing-title'));
		});

		test('should throw error if title is empty when posting with edit thread permission', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				'',
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('missing-title'));
		});

		test('should throw error if title is empty when editing post with edit thread permission', async () =>
		{
			// Arrange, Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				'',
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				true,
				true,
				parentDetails,
			)).rejects.toThrow(new UserError('missing-title'));
		});

		test('should throw error if text is empty', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				'',
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('missing-content'));
		});

		test('should throw multiple errors together', async () =>
		{
			// Arrange
			const errors = ['missing-title', 'missing-content'];

			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				'',
				'',
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError(...errors));
		});

		test('should throw error if user does not exist (adding users)', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				['ACC'],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('no-such-user'));
		});

		test('should throw error if user is blocked (adding users)', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				['ACC'],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('blocked'));
		});

		test('should throw error if user does not exist (removing users)', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				['ACC'],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('no-such-user'));
		});

		test('should throw error if user is blocked (removing users)', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ id: constants.accUserId }]);
			mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				['ACC'],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('blocked'));
		});

		test('should throw error if new member posting too many threads', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 11 }]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('new-member-restrictions'));
		});

		test('should throw error if new member posting too many posts', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 26 }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('new-member-restrictions'));
		});

		test('should throw error if new member posted too soon (thread)', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 1 }]);
			mockDbQuery.mockResolvedValueOnce([{ creation_time: thirtySecondsAgo }]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('new-member-restrictions'));
		});

		test('should throw error if new member posted too soon (post)', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 1 }]);
			mockDbQuery.mockResolvedValueOnce([{ creation_time: thirtySecondsAgo }]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('new-member-restrictions'));
		});

		test('should not throw error if new member posts on Adoptee BT', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				id: constants.boardIds.adopteeBT,
			};

			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should not throw error if new member edits post on Adoptee BT', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				parent_node_id: constants.boardIds.adopteeBT,
			};

			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should not throw error if new member posts on Adoptee Thread', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				id: constants.boardIds.adopteeThread,
			};

			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should not throw error if new member edits post on Adoptee Thread', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				parent_node_id: constants.boardIds.adopteeThread,
			};

			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should not throw error if new member creates new PT (count)', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				parent_node_id: constants.boardIds.privateThreads,
			};

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const sixMinutesAgo = new Date(Date.now() - 60 * 6000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ creation_time: sixMinutesAgo }]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should not throw error if new member posts on PT (count)', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				parent_node_id: constants.boardIds.privateThreads,
			};

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const sixMinutesAgo = new Date(Date.now() - 60 * 6000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ creation_time: sixMinutesAgo }]);
			mockDbQuery.mockResolvedValueOnce([]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				tempParentDetails,
			)).resolves.not.toThrow();
		});

		test('should throw error if user posts on blocked users thread', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId }]);

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('blocked'));
		});

		test('should minimum include yourself for PT', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				id: constants.boardIds.privateThreads,
			};

			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockDbQuery.mockResolvedValueOnce([{ id: mockAPIContext.userId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });

			// Act
			const [addUsers, _] = await create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[ 'test-user' ],
				[],
				'thread',
				true,
				false,
				false,
				tempParentDetails,
			);

			// Assert
			expect(addUsers).toEqual([ mockAPIContext.userId ]);
		});

		test('should include yourself with others for Shop Thread', async () =>
		{
			// Arrange
			const tempParentDetails: create.ParentDetailsType = {
				...parentDetails,
				id: constants.boardIds.privateThreads,
			};

			const testDeveloperId = 11;

			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockDbQuery.mockResolvedValueOnce([{ id: testDeveloperId }]);
			mockDbQuery.mockResolvedValueOnce([]);
			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });

			// Act
			const [addUsers, _] = await create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[ 'test-developer' ],
				[],
				'thread',
				true,
				false,
				false,
				tempParentDetails,
			);

			// Assert
			expect(addUsers).toEqual([ testDeveloperId, mockAPIContext.userId ]);
		});
	});

	describe('updateTitleOrPost function', () =>
	{
		describe('create thread', () =>
		{
			test('should create thread', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					expectedAPIData.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					false,
					false,
					'thread',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create PT with users', async () =>
			{
				// Arrange
				const tempParentDetails: create.ParentDetailsType = {
					...parentDetails,
					id: constants.boardIds.privateThreads,
				};

				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					expectedAPIData.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[ mockAPIContext.userId ],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					false,
					false,
					'thread',
					tempParentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create thread as sticky', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					expectedAPIData.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'sticky',
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					false,
					false,
					'thread',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create thread as admin-lock', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					expectedAPIData.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'admin',
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					false,
					false,
					'thread',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});
		});

		describe('create post', () =>
		{
			test('should create post', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post with new title', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					expectedAPIData.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post with file(s)', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([{ id: 8574 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post with adding users', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[ 94392 ],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post with removing users', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[ 94392 ],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post and sticky thread', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'sticky',
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post and admin-lock thread', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'admin',
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post and lock thread', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					true,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should create post and move thread', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }])
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					958473,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});
		});

		describe('edit post', () =>
		{
			test('should edit post', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post with new title', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([{ id: 48372 }]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					'Blah',
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post with file(s)', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([{ id: 8574 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					expectedAPIData.fileIds,
					expectedAPIData.fileNames,
					expectedAPIData.fileWidths,
					expectedAPIData.fileHeights,
					expectedAPIData.fileCaptions,
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post with adding users', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[ 94392 ],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post with removing users', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[ 94392 ],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post and sticky thread', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'sticky',
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post and admin-lock thread', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }])
						.mockResolvedValueOnce([]);

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					'admin',
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});
		});
	});

	test('should replace text when scout locking Adoptee Thread', async () =>
	{
		// Arrange
		const tempParentDetails: create.ParentDetailsType = {
			...parentDetails,
			parent_node_id: constants.boardIds.adopteeThread,
		};

		const tempData = {
			...data,
			fileCaptions: '',
			fileIds: '',
			fileNames: '',
			fileWidths: '',
			fileHeights: '',
			lock: 'true',
			title: '',
			text: '',
		};

		const newNodeId = 58473;

		mockDbQuery.mockResolvedValueOnce([{ id: expectedAPIData.parentId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(create.default.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([tempParentDetails]);
		mockAPIContext.query.mockResolvedValueOnce(false);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: 1234 }]);

		mockDbQuery.mockResolvedValueOnce([{ adoptee_id: 4738, scout_id: mockAPIContext.userId }]);
		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, username: 'test-user' });
		mockAPIContext.query.mockResolvedValueOnce({ id: 8473, username: 'test-new-member' });
		mockAPIContext.query.mockResolvedValueOnce({ closingTemplate: `Hi **AdopteeName**!

I see that you're no longer a new member now.

I hope I was able to help you with your introduction to ACC! Feel free to reach out to me anytime!

ScoutName
ACC Scout`, closingTemplateFormat: 'markdown' });

		mockDbQuery.mockResolvedValueOnce([]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: newNodeId }])
				.mockResolvedValueOnce([{ id: 59483 }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		mockDbQuery.mockResolvedValueOnce([{ flag_option: 'create_reply' }]);
		mockDbQuery.mockResolvedValueOnce([{ node_id: parentDetails.id }]);

		mockAPIContext.query.mockResolvedValueOnce(null);
		mockAPIContext.query.mockResolvedValueOnce(null);

		// Act
		const result = await create.default.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({ id: newNodeId });
	});

	describe('validateLock function', () =>
	{
		test('should skip validation when lock is false', async () =>
		{
			// Act & Assert
			await expect(create.validateLock.call(
				mockAPIContext,
				false,
				parentDetails,
			)).resolves.toBeUndefined();
		});
	});

	describe('validateThreadType function', () =>
	{
		test('should skip validation when type is normal', async () =>
		{
			// Act & Assert
			await expect(create.validateThreadType.call(
				mockAPIContext,
				'normal',
				parentDetails,
			)).resolves.toBeUndefined();
		});
	});

	describe('validateBoardId function', () =>
	{
		test('should skip validation when boardId is 0', async () =>
		{
			// Act & Assert
			await expect(create.validateBoardId.call(
				mockAPIContext,
				0,
				parentDetails,
			)).resolves.toBeUndefined();
		});
	});

	describe('validateFileArrays function', () =>
	{
		test('should allow more images for threads than posts', async () =>
		{
			// Arrange — create array with more than imagesPost but within imagesThread
			const count = constants.max.imagesPost + 1;

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 32);

			mockAPIContext.query.mockResolvedValueOnce({ signupDate: yesterday.toISOString() });

			// Act & Assert — should not throw for thread
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'thread',
				false,
				Array(count).fill(expectedAPIData.fileIds[0]),
				Array(count).fill(expectedAPIData.fileNames[0]),
				Array(count).fill(expectedAPIData.fileWidths[0]),
				Array(count).fill(expectedAPIData.fileHeights[0]),
				Array(count).fill(expectedAPIData.fileCaptions[0]),
			)).resolves.toBeUndefined();
		});

		test('should allow more images when editing thread post', async () =>
		{
			// Arrange
			const count = constants.max.imagesPost + 1;

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 32);

			mockAPIContext.query.mockResolvedValueOnce({ signupDate: yesterday.toISOString() });

			// Act & Assert — should not throw for editingThreadPost
			await expect(create.validateFileArrays.call(
				mockAPIContext,
				'post',
				true,
				Array(count).fill(expectedAPIData.fileIds[0]),
				Array(count).fill(expectedAPIData.fileNames[0]),
				Array(count).fill(expectedAPIData.fileWidths[0]),
				Array(count).fill(expectedAPIData.fileHeights[0]),
				Array(count).fill(expectedAPIData.fileCaptions[0]),
			)).resolves.toBeUndefined();
		});
	});

	describe('validateTextTitle function', () =>
	{
		test('should skip profanity check when title and text are both empty', async () =>
		{
			// Act & Assert — no profanity mocks needed, should return early
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				'',
				'',
				parentDetails,
				'thread',
				false,
				false,
				false,
			)).resolves.toBeUndefined();
		});

		test('should allow longer text with 5+ monthly perks', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]); // staff boards
			mockDbProfanity.mockResolvedValueOnce(null); // title
			mockDbProfanity.mockResolvedValueOnce(null); // text
			mockAPIContext.query.mockResolvedValueOnce({
				id: mockAPIContext.userId,
				donations: 0,
				perks: 0,
				monthlyPerks: 5,
			});

			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.post2);

			// Act & Assert — post2 length should be allowed with 5+ perks
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'thread',
				false,
				true,
				false,
			)).resolves.toBeUndefined();

			// Cleanup
			spy.mockRestore();
		});

		test('should allow longer text with 10+ monthly perks', async () =>
		{
			// Arrange
			mockDbQuery.mockResolvedValueOnce([{ id: 4839 }]); // staff boards
			mockDbProfanity.mockResolvedValueOnce(null); // title
			mockDbProfanity.mockResolvedValueOnce(null); // text
			mockAPIContext.query.mockResolvedValueOnce({
				id: mockAPIContext.userId,
				donations: 0,
				perks: 0,
				monthlyPerks: 10,
			});

			const spy = vi.spyOn(utils, 'realStringLength').mockImplementation(() => constants.max.post3);

			// Act & Assert — post3 length should be allowed with 10+ perks
			await expect(create.validateTextTitle.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				parentDetails,
				'thread',
				false,
				true,
				false,
			)).resolves.toBeUndefined();

			// Cleanup
			spy.mockRestore();
		});
	});

	describe('validateServerSide function', () =>
	{
		test('should skip new member restrictions for non-new member', async () =>
		{
			// Arrange
			const oneMonthIn = new Date();
			oneMonthIn.setDate(oneMonthIn.getDate() - 32);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: oneMonthIn.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([]); // blocked check

			// Act & Assert — no count or timing queries needed
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).resolves.toBeDefined();
		});

		test('should allow new member thread when last post was over 5 minutes ago', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 1 }]); // thread count
			mockDbQuery.mockResolvedValueOnce([{ creation_time: sixMinutesAgo }]); // last thread

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).resolves.toBeDefined();
		});

		test('should reject new member thread when last post was under 5 minutes ago', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 1 }]); // thread count
			mockDbQuery.mockResolvedValueOnce([{ creation_time: twoMinutesAgo }]); // last thread

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'thread',
				true,
				false,
				false,
				parentDetails,
			)).rejects.toThrow(new UserError('new-member-restrictions'));
		});

		test('should allow new member post when last post was over 1 minute ago', async () =>
		{
			// Arrange
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

			mockAccountsGetData.mockResolvedValueOnce({ id: mockAppContext.session!.user, username: mockAppContext.session!.username, signup_date: yesterday.toISOString().split('T')[0] });
			mockDbQuery.mockResolvedValueOnce([{ count: 1 }]); // post count
			mockDbQuery.mockResolvedValueOnce([{ creation_time: twoMinutesAgo }]); // last post
			mockDbQuery.mockResolvedValueOnce([]); // blocked check

			// Act & Assert
			await expect(create.validateServerSide.call(
				mockAPIContext,
				expectedAPIData.title,
				expectedAPIData.text,
				[],
				[],
				'post',
				true,
				false,
				false,
				parentDetails,
			)).resolves.toBeDefined();
		});
	});

	describe('updateTitleOrPost function', () =>
	{
		describe('edit post', () =>
		{
			test('should edit post and lock thread', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }]) // node revision
						.mockResolvedValueOnce([]) // lock update
						.mockResolvedValueOnce([]); // shop order update

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					true,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post and move thread', async () =>
			{
				// Arrange
				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }]) // node revision
						.mockResolvedValueOnce([]); // move update

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					958473,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(parentDetails.id);
			});

			test('should edit post with add/remove users on PT via parent2 path', async () =>
			{
				// Arrange
				const tempParentDetails: create.ParentDetailsType = {
					...parentDetails,
					parent2_id: 38293,
					parent2_parent_id: constants.boardIds.privateThreads,
				};

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: 48372 }]) // node revision
						.mockResolvedValueOnce([]) // add read perm
						.mockResolvedValueOnce([]) // add reply perm
						.mockResolvedValueOnce([]) // add react perm
						.mockResolvedValueOnce([]); // remove users

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.parent_title,
					expectedAPIData.text,
					expectedAPIData.format,
					expectedAPIData.lock,
					[ 94392 ],
					[ 12345 ],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					true,
					false,
					'post',
					tempParentDetails,
				);

				// Assert
				expect(result).toEqual(tempParentDetails.id);
			});
		});

		describe('markdown processing', () =>
		{
			test('should extract quotes from markdown post', async () =>
			{
				// Arrange
				const newNodeId = 4829;
				const postText = '> This is a quoted reply\n\nMy response here';

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }]) // insert node
						.mockResolvedValueOnce([{ id: 48372 }]) // node revision
						.mockResolvedValueOnce([]); // quote insert

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					postText,
					'markdown',
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should skip quote extraction for non-markdown format', async () =>
			{
				// Arrange
				const newNodeId = 4829;

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }]) // insert node
						.mockResolvedValueOnce([{ id: 48372 }]); // node revision
					// no quote query

					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					expectedAPIData.text,
					'bbcode',
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});

			test('should extract polls from markdown post', async () =>
			{
				// Arrange
				const newNodeId = 4829;
				const postText = '[poll]\n- Option A\n- Option B\n- Option C\n[/poll]\n\nVote above!';

				vi.spyOn(db, 'transaction').mockImplementation(async operate =>
				{
					const mockQuery = vi.fn();

					mockQuery
						.mockResolvedValueOnce([{ id: newNodeId }]) // insert node
						.mockResolvedValueOnce([{ id: 48372 }]) // node revision
						.mockResolvedValueOnce([]) // update thread_type
						.mockResolvedValueOnce([{ id: 99 }]) // insert poll
						.mockResolvedValueOnce([]); // insert poll options

					console.log(mockQuery.mock.calls.length);
					return await operate(mockQuery);
				});

				// Act
				const result = await create.updateTitleOrPost.call(
					mockAPIContext,
					parentDetails.title,
					postText,
					'markdown',
					expectedAPIData.lock,
					[],
					[],
					expectedAPIData.type,
					expectedAPIData.boardId,
					[],
					[],
					[],
					[],
					[],
					false,
					false,
					'post',
					parentDetails,
				);

				// Assert
				expect(result).toEqual(newNodeId);
			});
		});
	});
});
