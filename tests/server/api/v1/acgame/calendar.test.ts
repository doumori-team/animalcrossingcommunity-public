import { describe, test, expect } from 'vitest';

import calendar from 'server/api/v1/acgame/calendar';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { mockAPIContext, mockDbQuery, mockCacheQuery, mockACCCache } from 'tests/vitest.setup.ts';
import { constants } from '@utils';
import * as eventsData from 'server/data/catalog/events.ts';
import { residents } from 'server/data/catalog/residents.ts';
import { creatures } from 'server/data/catalog/creatures.ts';

const data = {
	requester: 'homepage',
	debug: '',
};

const expectedAPIData = {
	requester: 'homepage',
	debug: '',
	gameId: 0,
};

const calendarCategories = [
	{ identifier: 'events', name: 'Seasons & Events' },
	{ identifier: 'creatures', name: 'Fish, Bugs & Sea Creatures' },
	{ identifier: 'birthdays', name: 'Villager Birthdays' },
];

describe('calendar API function', () =>
{
	test('api tests are converted correctly', async () =>
	{
		// Arrange & Act
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		// Assert
		expect(apiData).toEqual(expect.objectContaining(expectedAPIData));
	});

	test('should return nothing if user lacks permission', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(false);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual({
			game: {},
			months: [],
		});
	});

	test('should throw error if invalid month', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			month: '13',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(calendar.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if invalid year', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			year: '-2025',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);

		// Act & Assert
		await expect(calendar.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if AC Game does not exist', async () =>
	{
		// Arrange
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);
		mockACCCache.get.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(calendar.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should throw error if AC Game does not support year', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			year: '2025',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);
		mockACCCache.get.mockResolvedValueOnce({
			[constants.gameIds.ACNH]: [],
		});

		// Act & Assert
		await expect(calendar.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should return default calendar for homepage (NH Events)', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			game: {
				id: 8,
				name: shortname,
			},
		}));
		expect(result.months).toBeTruthy();
		expect(result.months.length).toBe(1);
		expect(result.months[0].categories.length).toBe(1);
		expect(result.months[0].categories).toEqual(expect.arrayContaining([expect.objectContaining({
			name: 'Seasons & Events',
			identifier: 'events',
		})]));
		result.months[0].categories.forEach(category =>
		{
			expect(Array.isArray(category.events)).toBe(true);
			expect(category.events.length).toBeGreaterThan(0);
		});
	});

	test('should use debug', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const tempData = {
			...data,
			debug: '2025-11-20',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			game: {
				id: 8,
				name: shortname,
			},
			months: [
				expect.objectContaining({
					id: 11,
					name: 'November',
					year: 2025,
				}),
			],
		}));
		expect(result.months).toBeTruthy();
		expect(result.months.length).toBe(1);
		expect(result.months[0].categories.length).toBe(1);
		expect(result.months[0].categories).toEqual(expect.arrayContaining([expect.objectContaining({
			name: 'Seasons & Events',
			identifier: 'events',
		})]));
		result.months[0].categories.forEach(category =>
		{
			expect(Array.isArray(category.events)).toBe(true);
			expect(category.events.length).toBeGreaterThan(0);
		});
	});

	test('should grab user setting', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: 1, game_id: constants.gameIds.ACNH, game_name: 'AC:NH', hemisphere_name: 'North' }]);
		mockDbQuery.mockResolvedValueOnce([
			{ identifier: 'creatures' },
			{ identifier: 'events' },
			{ identifier: 'birthdays' },
		]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			game: {
				id: 8,
				name: shortname,
			},
		}));
		expect(result.months).toBeTruthy();
		expect(result.months.length).toBe(1);
		expect(result.months[0].categories.length).toBe(3);
		expect(result.months[0].categories).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'Seasons & Events',
					identifier: 'events',
				}),
				expect.objectContaining({
					name: 'Villager Birthdays',
					identifier: 'birthdays',
				}),
				expect.objectContaining({
					name: 'Fish, Bugs & Sea Creatures',
					identifier: 'creatures',
				}),
			]),
		);
		result.months[0].categories.forEach(category =>
		{
			expect(Array.isArray(category.events)).toBe(true);
			expect(category.events.length).toBeGreaterThan(0);
		});
	});

	test('should return default calendar for Calendar Page', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const gameId = constants.gameIds.ACNH;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '',
			year: '',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			game: {
				id: gameId,
				name: shortname,
			},
		}));
		expect(result.months).toBeTruthy();
		expect(result.months.length).toBe(1);
		expect(result.months[0].categories.length).toBe(3);
		expect(result.months[0].categories).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: 'Seasons & Events',
					identifier: 'events',
				}),
				expect.objectContaining({
					name: 'Villager Birthdays',
					identifier: 'birthdays',
				}),
				expect.objectContaining({
					name: 'Fish, Bugs & Sea Creatures',
					identifier: 'creatures',
				}),
			]),
		);
		result.months[0].categories.forEach(category =>
		{
			expect(Array.isArray(category.events)).toBe(true);
			expect(category.events.length).toBeGreaterThan(0);
		});
	});

	test('should return All Months for Calendar Page', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const gameId = constants.gameIds.ACNH;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '0',
			year: '2025',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(
			expect.objectContaining({
				game: {
					id: 8,
					name: shortname,
				},
				months: expect.any(Array),
			}),
		);
		expect(result.months).toBeTruthy();
		expect(result.months.length).toBe(12);

		const monthNames = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December',
		];

		result.months.forEach((month, index) =>
		{
			expect(month).toEqual(expect.objectContaining({
				id: index + 1,
				name: monthNames[index],
				year: 2025,
			}));

			expect(Array.isArray(month.categories)).toBe(true);
			expect(month.categories.length).toBe(3);

			expect(month.categories).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: 'Seasons & Events',
						identifier: 'events',
					}),
					expect.objectContaining({
						name: 'Villager Birthdays',
						identifier: 'birthdays',
					}),
					expect.objectContaining({
						name: 'Fish, Bugs & Sea Creatures',
						identifier: 'creatures',
					}),
				]),
			);

			month.categories.forEach(category =>
			{
				expect(Array.isArray(category.events)).toBe(true);
				expect(category.events.length).toBeGreaterThan(0);
			});
		});
	});

	test(`bug fix: should use debug for yesterday's date`, async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const tempData = {
			...data,
			debug: '2025-06-03',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: 1, game_id: constants.gameIds.ACNH, game_name: 'AC:NH', hemisphere_name: 'North' }]);
		mockDbQuery.mockResolvedValueOnce([
			{ identifier: 'birthdays' },
		]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		result.months[0].categories[0].events.forEach(obj =>
		{
			expect(obj.timing).toMatch(/Jun|Jul/);
		});
	});

	test(`bug fix: should show villager birthdays with today's date`, async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const tempData = {
			...data,
			debug: '2025-05-03',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: 1, game_id: constants.gameIds.ACNH, game_name: 'AC:NH', hemisphere_name: 'North' }]);
		mockDbQuery.mockResolvedValueOnce([
			{ identifier: 'birthdays' },
		]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result.months[0].categories[0].events).toContainEqual(expect.objectContaining({
			name: 'Sylvia',
			timing: 'Sat, May 3',
		}));
	});

	test('should throw error if invalid debug date', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			debug: 'notadate',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([]);

		// Act & Assert
		await expect(calendar.call(mockAPIContext, apiData)).rejects.toThrow(new UserError('bad-format'));
	});

	test('should return calendar for non-ACNH game', async () =>
	{
		// Arrange
		const shortname = 'AC:NL';
		const gameId = constants.gameIds.ACNL;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '6',
			year: '2025',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result).toEqual(expect.objectContaining({
			game: {
				id: gameId,
				name: shortname,
			},
		}));
		expect(result.months.length).toBe(1);
		expect(result.months[0].id).toBe(6);
		expect(result.months[0].categories.length).toBe(3);
	});

	test('should return calendar for logged-out user (no userId)', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const noUserContext = {
			...mockAPIContext,
			userId: undefined,
		};

		const apiData = await APITypes.parse.bind(noUserContext)(calendar.apiTypes, data);

		noUserContext.query.mockResolvedValueOnce(true);
		// No DB query for settings since no userId
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(noUserContext, apiData);

		// Assert
		expect(result.game.id).toBe(constants.gameIds.ACNH); // defaults to ACNH
		expect(result.months.length).toBe(1);
		// No user settings, so homepage defaults to events only
		expect(result.months[0].categories.length).toBe(1);
		expect(result.months[0].categories[0].identifier).toBe('events');
	});

	test('should use user setting with South hemisphere', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, data);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockDbQuery.mockResolvedValueOnce([{ id: 1, game_id: constants.gameIds.ACNH, game_name: 'AC:NH', hemisphere_name: 'South' }]);
		mockDbQuery.mockResolvedValueOnce([
			{ identifier: 'events' },
		]);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		expect(result.game.id).toBe(constants.gameIds.ACNH);
		expect(result.months[0].categories.length).toBe(1);
		expect(result.months[0].categories[0].identifier).toBe('events');
		// SH events should be present
		expect(result.months[0].categories[0].events.length).toBeGreaterThan(0);
	});

	test('events are sorted by start date', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const gameId = constants.gameIds.ACNH;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '1',
			year: '2025',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		const eventsCategory = result.months[0].categories.find(c => c.identifier === 'events');

		if (eventsCategory && eventsCategory.events.length > 1)
		{
			for (let i = 1; i < eventsCategory.events.length; i++)
			{
				const prev = eventsCategory.events[i - 1].sortDate as Date;
				const curr = eventsCategory.events[i].sortDate as Date;
				expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
			}
		}
	});

	test('birthdays are sorted by date', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const gameId = constants.gameIds.ACNH;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '5',
			year: '2025',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		const birthdayCategory = result.months[0].categories.find(c => c.identifier === 'birthdays');

		if (birthdayCategory && birthdayCategory.events.length > 1)
		{
			for (let i = 1; i < birthdayCategory.events.length; i++)
			{
				const prev = birthdayCategory.events[i - 1].sortDate as Date;
				const curr = birthdayCategory.events[i].sortDate as Date;
				expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
			}
		}
	});

	test('creatures are sorted alphabetically', async () =>
	{
		// Arrange
		const shortname = 'AC:NH';
		const gameId = constants.gameIds.ACNH;
		const tempData = {
			requester: 'calendar',
			gameId: `${gameId}`,
			month: '7',
			year: '2025',
		};

		mockDbQuery.mockResolvedValueOnce([{ id: gameId }]);
		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		mockAPIContext.query.mockResolvedValueOnce(true);
		mockACCCache.get.mockResolvedValueOnce(eventsData.years);
		mockCacheQuery.mockResolvedValueOnce([{ game_name: shortname }]);
		mockDbQuery.mockResolvedValueOnce(calendarCategories);
		mockACCCache.get.mockResolvedValueOnce(eventsData.events);
		mockACCCache.get.mockResolvedValueOnce(residents);
		mockACCCache.get.mockResolvedValueOnce(creatures);

		// Act
		const result = await calendar.call(mockAPIContext, apiData);

		// Assert
		const creatureCategory = result.months[0].categories.find(c => c.identifier === 'creatures');

		if (creatureCategory && creatureCategory.events.length > 1)
		{
			for (let i = 1; i < creatureCategory.events.length; i++)
			{
				const prev = creatureCategory.events[i - 1].name;
				const curr = creatureCategory.events[i].name;
				expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
			}
		}
	});

	test('month 0 is valid (used for all months view)', async () =>
	{
		// Arrange
		const tempData = {
			...data,
			requester: 'homepage',
			month: '0',
		};

		const apiData = await APITypes.parse.bind(mockAPIContext)(calendar.apiTypes, tempData);

		// month 0 should NOT throw bad-format — it's the "all months" flag
		expect(apiData.month).toBe(0);
	});
});
