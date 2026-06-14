import { describe, test, expect, vi } from 'vitest';

import claim from 'server/api/v1/treasure/claim';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery } from 'tests/vitest.setup.ts';
import * as db from '@db';

const data = {
	id: '483748',
};

const expectedAPIData = {
	id: 483748,
};

describe('claim API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, claim.permissions)).rejects.toThrow(new UserError('permission'));
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
		await expect(APIPerms.check.call(tempAPIContext, claim.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if treasure does not exist', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(claim.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-treasure'));
	});

	test('should throw error if treasure is not yours', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: constants.accUserId, expired: false, redeemed_user_id: null, type: 'amount', bells: 100 }]);

		// Act & Assert
		await expect(claim.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('treasure-invalid-user'));
	});

	test('should throw error if treasure is already redeemed', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: mockAPIContext.userId, type: 'amount', bells: 100 }]);

		// Act & Assert
		await expect(claim.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('treasure-redeemed'));
	});

	test('should throw error if treasure is expired', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: true, redeemed_user_id: null, type: 'amount', bells: 100 }]);

		// Act & Assert
		await expect(claim.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('treasure-expired'));
	});

	test('should claim if claiming bells', async () =>
	{
		// Arrange
		const bells = 100;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'amount', bells: bells }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '100' });

		// Act
		const result = await claim.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_success: `Congratulations! You have redeemed your ${bells.toLocaleString()} Bells, bringing your total to 100 Bells!`,
		});
	});

	test('should claim if claiming jackpot', async () =>
	{
		// Arrange
		const bells = 78473;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'jackpot', bells: null }]);

		mockAPIContext.query.mockResolvedValueOnce(bells);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '78,473' });

		// Act
		const result = await claim.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_success: `Congratulations! You have redeemed your ${bells.toLocaleString()} Bells, bringing your total to 78,473 Bells!`,
		});
	});

	test('should claim if claiming wisp', async () =>
	{
		// Arrange
		const bells = 100;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'wisp', bells: null }]);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([{ id: 4754, bells: bells }])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '78,473' });

		// Act
		const result = await claim.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_success: `Congratulations! You have redeemed your ${bells.toLocaleString()} Bells, bringing your total to 78,473 Bells!`,
		});
	});

	test('should call regenerateTopBells after claiming', async () =>
	{
		// Arrange
		const bells = 100;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'amount', bells: bells }]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const regenerateSpy = vi.spyOn(db, 'regenerateTopBells').mockResolvedValueOnce(undefined as any);

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			const mockQuery = vi.fn();

			mockQuery
				.mockResolvedValueOnce([]);

			return await operate(mockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '100' });

		// Act
		await claim.call(mockAPIContext, apiData);

		// Assert
		expect(regenerateSpy).toHaveBeenCalledWith({ userId: mockAPIContext.userId });

		regenerateSpy.mockRestore();
	});

	test('should redeem expired amount offers and update site setting on jackpot claim', async () =>
	{
		// Arrange
		const bells = 78473;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'jackpot', bells: null }]);

		mockAPIContext.query.mockResolvedValueOnce(bells);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([]) // redeem expired offers
				.mockResolvedValueOnce([]) // update site_setting
				.mockResolvedValueOnce([]) // redeem this offer
				.mockResolvedValueOnce([]) // set bells on offer
				.mockResolvedValueOnce([]); // refresh materialized view

			return await operate(transactionMockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '78,473' });

		// Act
		await claim.call(mockAPIContext, apiData);

		// Assert
		const redeemExpiredCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE treasure_offer') && sql.includes('type = \'amount\''),
		);

		expect(redeemExpiredCall).toBeTruthy();

		const siteSettingCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE site_setting'),
		);

		expect(siteSettingCall).toBeTruthy();

		const refreshCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('REFRESH MATERIALIZED VIEW'),
		);

		expect(refreshCall).toBeTruthy();

		const setBellsCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE treasure_offer') && sql.includes('bells = $2'),
		);

		expect(setBellsCall).toBeTruthy();
		expect(setBellsCall![2]).toEqual(bells);
	});

	test('should reclaim most recent unclaimed amount offer on wisp claim', async () =>
	{
		// Arrange
		const reclaimedBells = 100;
		const reclaimedOfferId = 4754;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'wisp', bells: null }]);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([{ id: reclaimedOfferId, bells: reclaimedBells }]) // find reclaim offer
				.mockResolvedValueOnce([]) // redeem reclaimed offer
				.mockResolvedValueOnce([]); // redeem this offer

			return await operate(transactionMockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '78,473' });

		// Act
		const result = await claim.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			_success: `Congratulations! You have redeemed your ${reclaimedBells.toLocaleString()} Bells, bringing your total to 78,473 Bells!`,
		});

		// Verify the reclaimed offer was redeemed
		const redeemReclaimCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE treasure_offer') && sql.includes('WHERE id = $2'),
		);

		expect(redeemReclaimCall).toBeTruthy();
		expect(redeemReclaimCall![2]).toEqual(reclaimedOfferId);
	});

	test('should skip bells update for amount type claim', async () =>
	{
		// Arrange
		const bells = 100;

		const apiData = await APITypes.parse.bind(mockAPIContext)(claim.apiTypes, data);

		mockDbQuery.mockResolvedValueOnce([{ user_id: mockAPIContext.userId, expired: false, redeemed_user_id: null, type: 'amount', bells: bells }]);

		const transactionMockQuery = vi.fn();

		vi.spyOn(db, 'transaction').mockImplementation(async operate =>
		{
			transactionMockQuery
				.mockResolvedValueOnce([]); // redeem this offer only

			return await operate(transactionMockQuery);
		});

		mockAPIContext.query.mockResolvedValueOnce({ id: mockAPIContext.userId, bells: '100' });

		// Act
		await claim.call(mockAPIContext, apiData);

		// Assert — should only have 1 query (redeem), no bells UPDATE
		const bellsUpdateCall = transactionMockQuery.mock.calls.find(([sql]) =>
			sql.includes('UPDATE treasure_offer') && sql.includes('bells = $2'),
		);

		expect(bellsUpdateCall).toBeFalsy();
		expect(transactionMockQuery).toHaveBeenCalledTimes(1);
	});
});
