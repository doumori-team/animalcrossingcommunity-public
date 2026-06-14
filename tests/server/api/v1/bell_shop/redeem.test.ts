import { describe, test, expect, vi } from 'vitest';

import redeem from 'server/api/v1/bell_shop/redeem';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as APIPerms from '@apiPerms';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';

const bellShopItem = {
	item: {
		id: 101,
		releaseDate: '2020-01-01',
		expireDurationMonths: null,
	},
	price: {
		nonFormattedPrice: 500,
		currency: constants.bellShop.currencies.bells,
	},
};

const bellShopItems = {
	price: {
		1: {
			2: bellShopItem,
		},
	},
};

const data = {
	id: '1',
	itemId: '2',
	userId: String(5),
	debug: '',
};

const expectedAPIData = {
	id: 1,
	itemId: 2,
	userId: 5,
	debug: '',
};

describe('redeem API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expectedAPIData);
	});

	test('should throw error if user lacks permission', async () =>
	{
		// Arrange
		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act & Assert
		await expect(APIPerms.check.call(mockAPIContext, redeem.permissions)).rejects.toThrow(new UserError('permission'));
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
		await expect(APIPerms.check.call(tempAPIContext, redeem.permissions)).rejects.toThrow(new UserError('login-needed'));
	});

	test('should throw error if item does not exist', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: undefined } } });

		// Act & Assert
		await expect(redeem.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-bell-shop-item'));
	});

	test('should throw error if item release date is in the future', async () =>
	{
		// Arrange
		const futureItem = {
			...bellShopItem,
			item: {
				...bellShopItem.item,
				releaseDate: '2099-01-01',
			},
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: futureItem } } });

		// Act & Assert
		await expect(redeem.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('no-such-bell-shop-item'));
	});

	test('should throw error if item already redeemed', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([{ id: 999 }]); // already redeemed

		// Act & Assert
		await expect(redeem.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bell-shop-item-redeemed'));
	});

	test('should throw error if user cannot afford item', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 100 }); // user (not enough bells)
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations

		// Act & Assert
		await expect(redeem.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bell-shop-not-enough-bells'));
	});

	test('should redeem item successfully', async () =>
	{
		// Arrange
		const redeemedId = 777;
		const userItems = [{ id: redeemedId }];

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce(null); // badge check (fire-and-forget)
		mockAPIContext.query.mockResolvedValueOnce(userItems); // bell_shop/items

		// Act
		const result = await redeem.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(userItems);
	});

	test('should apply 5% discount for 5+ monthly perks', async () =>
	{
		// Arrange
		const redeemedId = 777;

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 5 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		await redeem.call(mockAPIContext, apiData);

		// Assert — price should be 500 - ceil(500 * 0.05) = 500 - 25 = 475
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_bell_shop_redeemed'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![3]).toEqual(475); // discounted price
	});

	test('should apply 10% discount for 10+ monthly perks', async () =>
	{
		// Arrange
		const redeemedId = 777;

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 10 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		await redeem.call(mockAPIContext, apiData);

		// Assert — price should be 500 - ceil(500 * 0.10) = 500 - 50 = 450
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_bell_shop_redeemed'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![3]).toEqual(450); // discounted price
	});

	test('should throw error if gift exceeds bell limit', async () =>
	{
		// Arrange
		const expensiveItem = {
			...bellShopItem,
			price: {
				nonFormattedPrice: constants.bellShop.giftBellLimit + 1,
				currency: constants.bellShop.currencies.bells,
			},
		};

		const tempData = {
			...data,
			userId: String(constants.accUserId), // different user = gift
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, tempData);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: expensiveItem } } });
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 999999 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations

		// Act & Assert
		await expect(redeem.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bell-shop-gift-limit'));
	});

	test('should send notification when gifting to another user', async () =>
	{
		// Arrange
		const redeemedId = 777;

		const tempData = {
			...data,
			userId: String(constants.accUserId), // different user
		};

		const giftItem = {
			...bellShopItem,
			price: {
				nonFormattedPrice: 100, // under gift limit
				currency: constants.bellShop.currencies.bells,
			},
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, tempData);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: giftItem } } });
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce(null); // notification
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		await redeem.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api, params]) =>
			api === 'v1/notification/create' && params.type === constants.notification.types.giftBellShop,
		);

		expect(notificationCall).toBeTruthy();
		expect(notificationCall![1].id).toEqual(redeemedId);
	});

	test('should not send notification when redeeming for self', async () =>
	{
		// Arrange
		const redeemedId = 777;

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce(bellShopItems);
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		await redeem.call(mockAPIContext, apiData);

		// Assert
		const notificationCall = mockAPIContext.query.mock.calls.find(([api]) =>
			api === 'v1/notification/create',
		);

		expect(notificationCall).toBeFalsy();
	});

	test('should use expiring insert when item has expireDurationMonths', async () =>
	{
		// Arrange
		const expiringItem = {
			...bellShopItem,
			item: {
				...bellShopItem.item,
				expireDurationMonths: 3,
			},
		};

		const redeemedId = 777;

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, data);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: expiringItem } } });
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 1000 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		await redeem.call(mockAPIContext, apiData);

		// Assert
		const insertCall = mockDbQuery.mock.calls.find(([sql]) =>
			sql.includes('INSERT INTO user_bell_shop_redeemed') && sql.includes('expires'),
		);

		expect(insertCall).toBeTruthy();
		expect(insertCall![5]).toEqual(3); // expireDurationMonths
	});

	test('should allow gifting under bell limit', async () =>
	{
		// Arrange
		const redeemedId = 777;

		const giftItem = {
			...bellShopItem,
			price: {
				nonFormattedPrice: constants.bellShop.giftBellLimit,
				currency: constants.bellShop.currencies.bells,
			},
		};

		const tempData = {
			...data,
			userId: String(constants.accUserId),
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(redeem.apiTypes, tempData);

		mockACCCache.get.mockResolvedValueOnce({ price: { 1: { 2: giftItem } } });
		mockDbQuery.mockResolvedValueOnce([]); // not redeemed
		mockAPIContext.query.mockResolvedValueOnce({ nonFormattedTotalBells: 999999 }); // user
		mockAPIContext.query.mockResolvedValueOnce({ monthlyPerks: 0 }); // donations
		mockDbQuery.mockResolvedValueOnce([{ id: redeemedId }]); // insert
		mockAPIContext.query.mockResolvedValueOnce(null); // notification
		mockAPIContext.query.mockResolvedValueOnce(null); // badge check (fire-and-forget)
		mockAPIContext.query.mockResolvedValueOnce([]); // bell_shop/items

		// Act
		const result = await redeem.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual([]);
	});
});
