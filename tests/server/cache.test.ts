import { describe, test, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis-mock';

import { constants } from '@utils';
import { Cache } from '@cache';

let mockedVersion = 'initial';

vi.mock('@utils', async () =>
{
	const actual = await vi.importActual('@utils');

	return {
		...actual,
		constants: {
			...(actual.constants as Record<string, unknown>),
			get version()
			{
				return mockedVersion;
			},
		},
	};
});

describe('ACCCache', () =>
{
	let cache: Cache;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mockRedis: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let checkVersionSpy: any;

	beforeAll(() =>
	{
		// Disable mock from vitest.setup
		vi.unmock('@cache');
	});

	beforeEach(() =>
	{
		// Arrange
		mockedVersion = '1.0.0';
		mockRedis = new Redis();

		// Prevent constructor from kicking off real async work in most tests.
		checkVersionSpy = vi.spyOn(Cache.prototype, 'checkVersion').mockResolvedValue();

		cache = new Cache(mockRedis);
	});

	afterEach(async () =>
	{
		await mockRedis.flushall();
		checkVersionSpy?.mockRestore();
		vi.restoreAllMocks();
	});

	test('should initialize with a Redis client', () =>
	{
		// Assert
		expect(cache).toBeInstanceOf(Cache);
	});

	test('should log a message when no Redis client is provided', () =>
	{
		// Act
		const noClientCache = new Cache(null);

		// Assert
		expect(noClientCache).toBeInstanceOf(Cache);
	});

	test('should set and get cache values', async () =>
	{
		// Arrange
		const key = 'testKey';
		const value = { data: 'testValue' };

		// Act
		await cache.set(key, value);

		// Assert
		const result = await cache.get(key);
		expect(result).toEqual(value);
	});

	test('should return null for non-existent cache key', async () =>
	{
		// Act
		const result = await cache.get('nonExistentKey');

		// Assert
		expect(result).toBeNull();
	});

	test('should handle cache miss and call callback', async () =>
	{
		// Arrange
		const key = 'testKeyWithCallback';
		const callback = vi.fn().mockResolvedValue({ data: 'newData' });

		// Act
		const result = await cache.get(key, callback);

		// Assert
		expect(callback).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ data: 'newData' });
	});

	test('should return cached value after the callback is executed', async () =>
	{
		// Arrange
		const key = 'testKeyWithCallback';
		const callback = vi.fn().mockResolvedValue({ data: 'newData' });

		// Act
		await cache.get(key, callback);
		const result = await cache.get(key);

		// Assert
		expect(result).toEqual({ data: 'newData' });
		expect(callback).toHaveBeenCalledTimes(1);
	});

	test('should delete keys matching a pattern', async () =>
	{
		// Arrange
		await cache.set('testDeleteKey', { data: 'testValue' });
		await cache.set('otherKey', { data: 'otherValue' });

		// Act
		await cache.deleteMatch('test');

		// Assert
		const deletedResult = await cache.get('testDeleteKey');
		const otherResult = await cache.get('otherKey');

		expect(deletedResult).toBeNull();
		expect(otherResult).toEqual({ data: 'otherValue' });
	});

	test('should delete keys by pattern directly', async () =>
	{
		// Arrange
		await cache.set('alpha_one', { a: 1 });
		await cache.set('alpha_two', { a: 2 });
		await cache.set('beta_one', { b: 1 });

		// Act
		await cache.deleteByPattern(`${constants.version}_alpha*`);

		// Assert
		expect(await cache.get('alpha_one')).toBeNull();
		expect(await cache.get('alpha_two')).toBeNull();
		expect(await cache.get('beta_one')).toEqual({ b: 1 });
	});

	test('should flush all cache keys', async () =>
	{
		// Arrange
		const key1 = 'testFlushKey1';
		const key2 = 'testFlushKey2';

		await cache.set(key1, { data: 'value1' });
		await cache.set(key2, { data: 'value2' });

		// Act
		await cache.flush();

		// Assert
		const result1 = await cache.get(key1);
		const result2 = await cache.get(key2);

		expect(result1).toBeNull();
		expect(result2).toBeNull();
	});

	test('should check and set version if necessary', async () =>
	{
		// Arrange
		checkVersionSpy.mockRestore();

		// Act
		await cache.checkVersion();

		// Assert
		const version = await mockRedis.get('version');
		expect(version).toBe('1.0.0');
	}, 40000);

	test('should remove old versioned keys when version changes', async () =>
	{
		// Arrange
		await mockRedis.set('version', '1.0.0');
		await mockRedis.set('1.0.0_oldKey', JSON.stringify({ old: true }));
		await mockRedis.set('1.0.0_otherOldKey', JSON.stringify({ old: true }));

		mockedVersion = '2.0.0';
		checkVersionSpy.mockRestore();

		// Act
		await cache.checkVersion();

		// Assert
		expect(await mockRedis.get('1.0.0_oldKey')).toBeNull();
		expect(await mockRedis.get('1.0.0_otherOldKey')).toBeNull();
		expect(await mockRedis.get('version')).toBe('2.0.0');
	}, 40000);

	test('should remove lastVersion keys when version is already current', async () =>
	{
		// Arrange
		await mockRedis.set('version', '1.0.0');
		await mockRedis.set(`${constants.lastVersion}_staleKey`, JSON.stringify({ stale: true }));
		await mockRedis.set('1.0.0_currentKey', JSON.stringify({ current: true }));

		checkVersionSpy.mockRestore();

		// Act
		await cache.checkVersion();

		// Assert
		expect(await mockRedis.get(`${constants.lastVersion}_staleKey`)).toBeNull();
		expect(JSON.parse(await mockRedis.get('1.0.0_currentKey'))).toEqual({ current: true });
		expect(await mockRedis.get('version')).toBe('1.0.0');
	}, 40000);

	test('should prewarm AC Game Data with new version', async () =>
	{
		// Arrange
		await mockRedis.set('version', '1.0.0');
		mockedVersion = '2.0.0';
		checkVersionSpy.mockRestore();

		// Act
		await cache.checkVersion();

		// Assert
		const items = await cache.get(`${constants.cacheKeys.sortedAcGameCategories}_1_all_items`);

		expect(items).not.toBeNull();
		expect(items).not.toHaveLength(0);
	}, 40000);
});
