import request from 'supertest';
import { describe, test, expect } from 'vitest';

import handler from 'server/middleware/mail-parse.ts';
import { mockDbQuery, mockAccountsGetUserData } from 'tests/vitest.setup.ts';
import { UserError } from '@errors';

process.env.EMAIL_USER = 'devtest@animalcrossingcommunity.com';

describe('Support Email Handler', () =>
{
	test('returns 400 if body is missing or empty', async () =>
	{
		// ACt
		const response = await request(handler)
			.post('/mail');

		// Assert
		expect(response.status).toBe(400);
	});

	test('parses mail and inserts into database', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockResolvedValueOnce({ id: 123 });
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'ACC <devtest@animalcrossingcommunity.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(2);
		expect(mockAccountsGetUserData).toHaveBeenCalledWith(null, null, 'devtest@animalcrossingcommunity.com');
	});

	test('parses mail and inserts into database with current date', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockResolvedValueOnce({ id: 123 });
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'ACC <devtest@animalcrossingcommunity.com>')
			.field('text', 'This is the body text')
			.field('headers', '');

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(2);
		expect(mockAccountsGetUserData).toHaveBeenCalledWith(null, null, 'devtest@animalcrossingcommunity.com');
	});

	test('parses mail and inserts into database with no name', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockResolvedValueOnce({ id: 123 });
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'devtest@animalcrossingcommunity.com')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(2);
		expect(mockAccountsGetUserData).toHaveBeenCalledWith(null, null, 'devtest@animalcrossingcommunity.com');
	});

	test('parses mail and inserts into database for unknown user', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'John Doe <john@example.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(2);
		expect(mockAccountsGetUserData).toHaveBeenCalledWith(null, null, 'john@example.com');
	});

	test('should insert support email with correct user ID when user found', async () =>
	{
		// Arrange
		const userId = 123;

		mockAccountsGetUserData.mockResolvedValueOnce({ id: userId });
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'ACC <devtest@animalcrossingcommunity.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO support_email'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![1]).toEqual('devtest@animalcrossingcommunity.com'); // from
		expect(insertCall![2]).toEqual(userId); // from_user_id
		expect(insertCall![3]).toEqual(process.env.EMAIL_USER); // to
		expect(insertCall![4]).toEqual('Test Subject'); // subject
		expect(insertCall![6]).toEqual('This is the body text'); // body
	});

	test('should insert support email with null user ID when user not found', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'John Doe <john@example.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO support_email'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![2]).toBeNull(); // from_user_id
	});

	test('should swallow non-UserError from getUserData', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockRejectedValueOnce(new Error('Database connection failed'));
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'ACC <devtest@animalcrossingcommunity.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO support_email'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![2]).toBeNull(); // from_user_id still null
	});

	test('should insert notification for modmins', async () =>
	{
		// Arrange
		const supportEmailId = 456;

		mockAccountsGetUserData.mockResolvedValueOnce({ id: 123 });
		mockDbQuery.mockResolvedValueOnce([{ id: supportEmailId }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'ACC <devtest@animalcrossingcommunity.com>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);

		const notificationCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO notification'),
		);

		expect(notificationCall).toBeTruthy();
		expect(notificationCall![1]).toEqual(supportEmailId);
	});

	test('should keep raw from when angle brackets present but regex fails', async () =>
	{
		// Arrange
		mockAccountsGetUserData.mockRejectedValueOnce(new UserError('no-such-user'));
		mockDbQuery.mockResolvedValueOnce([{ id: 456 }]);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act
		const response = await request(handler)
			.post('/mail')
			.field('subject', 'Test Subject')
			.field('from', 'Bad Format <not-an-email>')
			.field('text', 'This is the body text')
			.field('headers', 'Date: Mon, 01 Jan 2024 10:00:00 -0400');

		// Assert
		expect(response.status).toBe(200);

		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO support_email'),
		);

		expect(insertCall).toBeTruthy();
		// from stays as original since regex didn't match
		expect(insertCall![1]).toEqual('not-an-email');
	});
});
