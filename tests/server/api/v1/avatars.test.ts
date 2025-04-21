import { describe, test, expect, vi } from 'vitest';

import avatars from 'server/api/v1/avatars';
import { UserError } from '@errors';
import { mockAPIContext, mockDbQuery, mockACCCache } from 'tests/vitest.setup.ts';
import * as avatarsData from 'server/data/avatar/avatars.ts';

describe('avatars API function', () =>
{
	test('should throw error if user is not logged in', async () =>
	{
		// Arrange
		const tempAPIContext = {
			userId: null,
			query: vi.fn(),
		};

		// Act & Assert
		await expect(avatars.call(tempAPIContext)).rejects.toThrow(new UserError('login-needed'));
	});

	test('returns avatars', async () =>
	{
		// Arrange
		mockDbQuery.mockResolvedValueOnce([{
			type: 'group',
			type_id: 2,
			granted: true,
			identifier: 'use-community-avatars',
		}]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);
		mockDbQuery.mockResolvedValueOnce([]);

		mockACCCache.get.mockResolvedValueOnce(avatarsData.indexedAvatarBackgrounds);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.indexedAvatarCharacters);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.indexedAvatarColorations);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.indexedAvatarAccents);

		const bellShopData = await import('server/data/catalog/info.ts');

		mockACCCache.get.mockResolvedValueOnce(avatarsData.alphabeticalAvatarBackgrounds);
		mockACCCache.get.mockResolvedValueOnce(bellShopData.sortedBellShopItems);
		mockACCCache.get.mockResolvedValueOnce(bellShopData.bellShopCategories);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.alphabeticalAvatarCharacters);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.alphabeticalAvatarAccents);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.alphabeticalAvatarColorations);
		mockACCCache.get.mockResolvedValueOnce(avatarsData.avatarTags);

		// Act
		const result = await avatars.call(mockAPIContext);

		// Assert
		expect(result).not.toBeUndefined();
	});
});
