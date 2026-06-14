import { describe, test, expect, vi } from 'vitest';

import signup from 'server/api/v1/signup/signup';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockAccountsGetUserData, mockDbQuery, mockAccountsSignup } from 'tests/vitest.setup.ts';
import { constants } from '@utils';

const data = {
	username: 'DoumourTest20',
	email: 'devtest+DoumoriTeam20@animalcrossingcommunity.com',
	birthday: '1990-01-01',
	ipAddresses: '127.0.0.1, 67.34.43.29',
};

const expectedAPIData = {
	username: 'DoumourTest20',
	email: 'devtest+DoumoriTeam20@animalcrossingcommunity.com',
	birthday: '1990-01-01',
	ipAddresses: '127.0.0.1, 67.34.43.29',
};

const tempAPIContext = {
	userId: null,
	query: vi.fn(),
	fullQuery: vi.fn(),
};

describe('signup API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(signup.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user is logged in', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(signup.apiTypes, data);

		// Act & Assert
		await expect(signup.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('permission'));
	});

	test('should throw error if username already taken', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			username: 'ACC',
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockResolvedValueOnce({});

		// Act & Assert
		await expect(signup.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('username-taken'));
	});

	test('should throw error if email already taken', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			email: 'devtest@animalcrossingcommunity.com',
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockResolvedValueOnce({});

		// Act & Assert
		await expect(signup.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('email-taken'));
	});

	test('should sign user up', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, data);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: '01',
				month: '01',
				year: '1990',
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await signup.call(tempAPIContext, apiData);

		// Assert
		expect(result).toEqual({ _callback: '/congrats' });
	});

	test('should sign user up if underage', async () =>
	{
		// Arrange
		const date = new Date();
		date.setFullYear(date.getFullYear() - 11);

		const tempData = {
			...data,
			birthday: date.toISOString(),
		};

		const guid = '0ef1c7dd-dac8-4a3e-aaea-8f5ddfdb57b2';

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: String(date.getMonth() + 1).padStart(2, '0'),
				month: String(date.getDate()).padStart(2, '0'),
				year: date.getFullYear(),
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([{ guid: guid }]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const result = await signup.call(tempAPIContext, apiData);

		// Assert
		expect(result).toEqual({ _callback: `/consent-needed/${guid}` });
	});

	test('should throw error if username contains whitespace', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			username: 'Bad Username',
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		// Act & Assert
		await expect(signup.call(tempAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should deny GG Board access for underage user', async () =>
	{
		// Arrange
		const date = new Date();
		date.setFullYear(date.getFullYear() - 11);

		const tempData = {
			...data,
			birthday: date.toISOString(),
		};

		const guid = '0ef1c7dd-dac8-4a3e-aaea-8f5ddfdb57b2';
		const userId = 485373;

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: userId,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: String(date.getDate()).padStart(2, '0'),
				month: String(date.getMonth() + 1).padStart(2, '0'),
				year: date.getFullYear(),
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([{ guid: guid }]); // consent log
		mockDbQuery.mockResolvedValueOnce([]); // update consent
		mockDbQuery.mockResolvedValueOnce([]); // gg board deny
		mockDbQuery.mockResolvedValueOnce([]); // ip address

		// Act
		await signup.call(tempAPIContext, apiData);

		// Assert
		const ggBoardCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_node_permission'),
		);

		expect(ggBoardCall).toBeTruthy();
		expect(ggBoardCall![1]).toEqual(userId);
		expect(ggBoardCall![2]).toEqual(constants.boardIds.ggBoard);
	});

	test('should not deny GG Board access for adult user', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, data);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: '01',
				month: '01',
				year: '1990',
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([]); // ip address

		// Act
		await signup.call(tempAPIContext, apiData);

		// Assert
		const ggBoardCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_node_permission'),
		);

		expect(ggBoardCall).toBeFalsy();
	});

	test('should record IP addresses correctly', async () =>
	{
		// Arrange
		const userId = 485373;

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, data);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: userId,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: '01',
				month: '01',
				year: '1990',
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([]); // ip address insert

		// Act
		await signup.call(tempAPIContext, apiData);

		// Assert — '127.0.0.1, 67.34.43.29' splits to ['127.0.0.1', '67.34.43.29'], pop removes last
		const ipCalls = mockDbQuery.mock.calls.filter(([sql]) =>
			sql.includes('INSERT INTO user_ip_address'),
		);

		expect(ipCalls.length).toEqual(1);
		expect(ipCalls[0][1]).toEqual(userId);
		expect(ipCalls[0][2]).toEqual('127.0.0.1');
	});

	test('should skip IP recording with single IP', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			ipAddresses: '127.0.0.1',
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: '01',
				month: '01',
				year: '1990',
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});

		// Act
		await signup.call(tempAPIContext, apiData);

		// Assert — single IP gets popped, nothing to insert
		const ipCalls = mockDbQuery.mock.calls.filter(([sql]) =>
			sql.includes('INSERT INTO user_ip_address'),
		);

		expect(ipCalls.length).toEqual(1);
		expect(ipCalls[0][2]).toEqual('127.0.0.1');
	});

	test('should skip IP recording when ipAddresses is null', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			ipAddresses: '',
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: '01',
				month: '01',
				year: '1990',
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});

		// Act
		await signup.call(tempAPIContext, apiData);

		// Assert
		const ipCalls = mockDbQuery.mock.calls.filter(([sql]) =>
			sql.includes('INSERT INTO user_ip_address'),
		);

		expect(ipCalls.length).toEqual(0);
	});

	test('should not require consent for exactly age 16', async () =>
	{
		// Arrange
		const date = new Date();
		date.setFullYear(date.getFullYear() - 16);

		const tempData = {
			...data,
			birthday: date.toISOString(),
		};

		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, tempData);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));

		mockAccountsSignup.mockResolvedValueOnce({
			id: 485373,
			username: expectedAPIData.username,
			email: expectedAPIData.email,
			signup_date: new Date().toISOString().split('T')[0],
			signup_date_legacy: '',
			birth_date: {
				day: String(date.getDate()).padStart(2, '0'),
				month: String(date.getMonth() + 1).padStart(2, '0'),
				year: date.getFullYear(),
			},
			production: true,
			address: null,
			consent_given: true,
			username_history: [],
		});
		mockDbQuery.mockResolvedValueOnce([]); // ip address

		// Act
		const result = await signup.call(tempAPIContext, apiData);

		// Assert — age 16 is NOT < 16, so no consent needed
		expect(result).toEqual({ _callback: '/congrats' });

		const consentCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO consent_log'),
		);

		expect(consentCall).toBeFalsy();
	});

	test('should re-throw non-UserError during username check', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, data);

		const dbError = new Error('Database connection failed');
		mockAccountsGetUserData.mockRejectedValueOnce(dbError);

		// Act & Assert
		await expect(signup.call(tempAPIContext, apiData)).rejects.toThrow('Database connection failed');
	});

	test('should re-throw non-UserError during email check', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(tempAPIContext)(signup.apiTypes, data);

		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		const dbError = new Error('Database connection failed');
		mockAccountsGetUserData.mockRejectedValueOnce(dbError);

		// Act & Assert
		await expect(signup.call(tempAPIContext, apiData)).rejects.toThrow('Database connection failed');
	});
});
