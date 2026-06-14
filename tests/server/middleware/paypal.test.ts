import { describe, test, vi, expect } from 'vitest';
import request from 'supertest';

import handler from 'server/middleware/paypal.ts';
import { mockDbQuery, mockACCCache, mockAPIContext, mockISOQuery, mockAccountsPushData, mockAccountsEmailUser } from 'tests/vitest.setup.ts';
import * as utils from 'server/middleware/paypal-utils.ts';
import { constants } from '@utils';

describe('PayPal Webhook Handler', () =>
{
	test('should not crash if called with no body', async () =>
	{
		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json');

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).not.toHaveBeenCalled();
	});

	test('ignores if signature is invalid', async () =>
	{
		// Arrange
		const payload = {};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(false));

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).not.toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create donation for Anonymous', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `Anonymous`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).not.toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create donation for other', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).not.toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create donation for user', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `${constants.accUserId}|${constants.accUserId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(1);
		expect(mockACCCache.deleteMatch).toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create donation for another user', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `${constants.accUserId}|${mockAPIContext.userId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);
		mockISOQuery.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(1);
		expect(mockACCCache.deleteMatch).toHaveBeenCalled();
		expect(mockISOQuery).toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create consent for user', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '0.30',
				},
				custom_id: `'0ef1c7dd-dac8-4a3e-aaea-8f5ddfdb57b2'`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]);
		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);
		mockAccountsPushData.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce([{ parent_email: 'devtest+ACC@animalcrossingcommunity.com' }]);
		mockDbQuery.mockResolvedValueOnce(null);
		mockAccountsEmailUser.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(5);
		expect(mockACCCache.deleteMatch).toHaveBeenCalled();
		expect(mockAccountsPushData).toHaveBeenCalled();
		expect(mockAccountsEmailUser).toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create subscription for user', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.SALE.COMPLETED',
			resource: {
				amount: {
					total: '5.00',
				},
				custom: `${constants.accUserId}|${constants.accUserId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(1);
		expect(mockACCCache.deleteMatch).toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should create subscription for another user', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.SALE.COMPLETED',
			resource: {
				amount: {
					total: '5.00',
				},
				custom: `${constants.accUserId}|${mockAPIContext.userId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);
		mockISOQuery.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).toHaveBeenCalledTimes(1);
		expect(mockACCCache.deleteMatch).toHaveBeenCalled();
		expect(mockISOQuery).toHaveBeenCalled();

		// Cleanup
		spy.mockRestore();
	});

	test('should store correct donation amount for capture', async () =>
	{
		// Arrange
		const donationAmount = '10.00';

		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: donationAmount,
				},
				custom_id: `${constants.accUserId}|${constants.accUserId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_donation'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![2]).toEqual(donationAmount); // donation
		expect(insertCall![3]).toEqual(false); // consent
		expect(insertCall![5]).toEqual(false); // monthly

		spy.mockRestore();
	});

	test('should set monthly flag for subscription payment', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.SALE.COMPLETED',
			resource: {
				amount: {
					total: '5.00',
				},
				custom: `${constants.accUserId}|${constants.accUserId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_donation'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![5]).toEqual(true); // monthly

		spy.mockRestore();
	});

	test('should set donatedBy to null when pipe value is not a number', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `${constants.accUserId}|notanumber`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_donation'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![4]).toBeNull(); // donatedBy

		spy.mockRestore();
	});

	test('should send gift donation notification with correct type', async () =>
	{
		// Arrange
		const donationId = 48574;

		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `${constants.accUserId}|${mockAPIContext.userId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ id: donationId }]);
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);
		mockISOQuery.mockResolvedValueOnce(null);

		// Act
		await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(mockISOQuery).toHaveBeenCalledWith(
			mockAPIContext.userId,
			'v1/notification/create',
			expect.objectContaining({
				id: donationId,
				type: constants.notification.types.giftDonation,
			}),
		);

		spy.mockRestore();
	});

	test('should call pushData and emailUser during consent flow', async () =>
	{
		// Arrange
		const parentEmail = 'devtest+parent@animalcrossingcommunity.com';
		const guid = '0ef1c7dd-dac8-4a3e-aaea-8f5ddfdb57b2';

		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '0.30',
				},
				custom_id: guid,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId }]); // consent_log lookup
		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]); // donation insert
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);
		mockAccountsPushData.mockResolvedValueOnce(null);
		mockDbQuery.mockResolvedValueOnce(null); // consent_log action 4
		mockDbQuery.mockResolvedValueOnce([{ parent_email: parentEmail }]); // consent_log parent email
		mockDbQuery.mockResolvedValueOnce(null); // update users consent
		mockAccountsEmailUser.mockResolvedValueOnce(null);

		// Act
		await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(mockAccountsPushData).toHaveBeenCalledWith(expect.objectContaining({
			user_id: constants.accUserId,
			consent_given: true,
		}));

		expect(mockAccountsEmailUser).toHaveBeenCalledWith(expect.objectContaining({
			email: parentEmail,
			subject: 'Consent Complete from Animal Crossing Community',
		}));

		// Verify consent_log action 4 was inserted
		const consentLogCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO consent_log') && sql.includes('action_id'),
		);

		expect(consentLogCall).toBeTruthy();

		// Verify users.consent_given updated
		const consentUpdateCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE users') && sql.includes('consent_given'),
		);

		expect(consentUpdateCall).toBeTruthy();

		spy.mockRestore();
	});

	test('should handle guid not found in consent_log', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '0.30',
				},
				custom_id: 'nonexistent-guid',
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockResolvedValueOnce([]); // consent_log not found
		mockDbQuery.mockResolvedValueOnce([{ id: 48574 }]); // donation insert (userId = guid string)
		mockACCCache.deleteMatch.mockResolvedValueOnce(null);

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);

		// consent flow should NOT run
		expect(mockAccountsPushData).not.toHaveBeenCalled();

		spy.mockRestore();
	});

	test('should ignore unhandled event types', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.REFUNDED',
			resource: {},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);
		expect(mockDbQuery).not.toHaveBeenCalled();

		spy.mockRestore();
	});

	test('should swallow errors during processing', async () =>
	{
		// Arrange
		const payload = {
			event_type: 'PAYMENT.CAPTURE.COMPLETED',
			resource: {
				amount: {
					value: '5.00',
				},
				custom_id: `${constants.accUserId}|${constants.accUserId}`,
			},
		};

		const spy = vi.spyOn(utils, 'verifySignature').mockImplementation(() => Promise.resolve(true));

		mockDbQuery.mockRejectedValueOnce(new Error('DB error'));

		// Act
		const response = await request(handler)
			.post('/paypal')
			.set('Content-Type', 'application/json')
			.send(JSON.stringify(payload));

		// Assert
		expect(response.status).toBe(200);

		spy.mockRestore();
	});
});
