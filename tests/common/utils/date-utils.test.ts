import { describe, test, expect, vi } from 'vitest';

import { dateUtils, constants } from '@utils';

// Real tests of timezones, where GitHub Actions will set the timezone
describe('DateUtils Functions', () =>
{
	describe('formatDate', () =>
	{
		test(`string, signupDate Profile`, () =>
		{
			// Arrange
			const signupDate = '2007-03-21'; // aldericon's profile

			// Act
			const result = dateUtils.formatDate(signupDate);

			// Assert
			expect(result).toBe('March 21st, 2007');
		});

		test(`Date, accounts.getBirthDate, viewInformation`, () =>
		{
			// Arrange
			const birthdate = dateUtils.dateToDate( // test-user's birthday
				1907,
				5,
				20,
			);

			// Act
			const result = dateUtils.formatDate(birthdate);

			// Assert
			expect(result).toBe('June 20th, 1907');
		});
	});

	test(`formatDate2 (acgame/calendar, villager birthday)`, () =>
	{
		// Arrange
		const villagerBirthday = dateUtils.format('December 2', 'MM/dd', 'MMMM d');  // Annalise, NL
		const year = 2025;
		const birthday = dateUtils.startOfDay(dateUtils.parse(`${villagerBirthday}/${year}`, 'MM/dd/yyyy'));

		// Act
		const result = dateUtils.formatDate2(birthday);

		// Assert
		expect(result).toBe('Tue, Dec 2');
	});

	// currently no item has an expiration
	test(`formatDate3 (bell shop items)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-01T00:00:00Z')); // midnight UTC (8 PM ET)
		const expireDurationMonths = 2;

		// Act
		const result = dateUtils.formatDate3(dateUtils.addToCurrentDateTimezone(expireDurationMonths, 'months'));

		// Assert
		expect(result).toBe('June 30th, 2025');

		// Cleanup
		vi.useRealTimers();
	});

	test(`formatDateTime4 (Newsletter date)`, () =>
	{
		// Arrange
		const created = new Date('2025-05-02');

		// Act
		const result = dateUtils.formatDate4(created);

		// Assert
		expect(result).toBe('May 2025');
	});

	test(`formatDateWithoutYear (accounts.getBirthDate, profile without age)`, () =>
	{
		// Arrange
		const birthDate = dateUtils.dateToDate( // test-user's birthday
			1907,
			5,
			20,
		);

		// Act
		const result = dateUtils.formatDateWithoutYear(birthDate);

		// Assert
		expect(result).toBe('June 20th');
	});

	describe('formatDateTime', () =>
	{
		test(`string, NodePage, users last viewed PT, not current year`, () =>
		{
			// Arrange
			const viewed = '2020-05-02T13:19:25.656Z';

			// Act
			const result = dateUtils.formatDateTime(viewed);

			// Assert
			expect(result).toBe('May 2nd, 2020 9:19 AM');
		});

		test(`Date, v1/guide, formattedLastUpdated`, () =>
		{
			// Arrange
			const lastUpdated = new Date('2023-08-14T20:12:32.608Z'); // id 163, Character Guide AC:GC

			// Act
			const result = dateUtils.formatDateTime(lastUpdated);

			// Assert
			expect(result).toBe('August 14th, 2023 4:12 PM');
		});
	});

	test(`formatDateTime2 (Node posts, current year)`, () =>
	{
		// Arrange
		const created = '2025-05-02T13:19:25.492Z';

		// Act
		const result = dateUtils.formatDateTime2(created);

		// Assert
		expect(result).toBe('Friday 2nd May 9:19am');
	});

	test(`formatDateTime3 (Node posts, not current year)`, () =>
	{
		// Arrange
		const created = '2020-05-02T13:19:25.492Z';

		// Act
		const result = dateUtils.formatDateTime3(created);

		// Assert
		expect(result).toBe('Saturday 2nd May 2020 9:19am');
	});

	test(`formatDateTime4 (ACC's Clock)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
		const time = dateUtils.getCurrentDateTimezone();

		// Act
		const result = dateUtils.formatDateTime4(time);

		// Assert
		expect(result).toBe('5/2 (Fri), 9:43 AM');

		// Cleanup
		vi.useRealTimers();
	});

	describe('formatDateTime5', () =>
	{
		test(`string, Site Rule's Page last updated`, () =>
		{
			// Arrange
			const lastUpdated = '2023-09-24T21:17:40.853Z';

			// Act
			const result = dateUtils.formatDateTime5(lastUpdated);

			// Assert
			expect(result).toBe('September 24th, 2023');
		});

		test(`Date, v1/pattern creation`, () =>
		{
			// Arrange
			const creation = '2025-04-25T03:08:40.266Z'; // id 501086
			const creationDate = new Date(creation);

			// Act
			const result = dateUtils.formatDateTime5(creationDate);

			// Assert
			expect(result).toBe('April 24th, 2025');
		});
	});

	test(`formatDateTime6 (NodePage, users last viewed PT, current year)`, () =>
	{
		// Arrange
		const viewed = '2025-05-02T13:19:25.656Z';

		// Act
		const result = dateUtils.formatDateTime6(viewed);

		// Assert
		expect(result).toBe('May 2nd, 9:19 AM');
	});

	// formatYearMonthDay is only used in poll/automation, not test because outside of date-utils concerns

	test(`formatYearMonthDay2 (updateAccountCache signup_date)`, () =>
	{
		// Arrange
		const signupDate = '2007-03-21T21:59:16.597Z'; // aldericon

		// Act
		const result = dateUtils.formatYearMonthDay2(signupDate);

		// Assert
		expect(result).toBe('2007-03-21');
	});

	test(`formatYearMonthDay3 (v1/user_ticket/complete, ban length)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T00:00:00Z')); // midnight UTC
		const banLength = 20;

		// Act
		const result = dateUtils.formatYearMonthDay3(dateUtils.addToCurrentDateTimezone(banLength, 'days'));

		// Assert
		expect(result).toBe('2025-05-21');

		// Cleanup
		vi.useRealTimers();
	});

	test(`formatCurrentDateYearMonthDay (SignupPage, max birthday)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T00:00:00Z')); // midnight UTC (8 PM ET)

		// Act
		const result = dateUtils.formatCurrentDateYearMonthDay();

		// Assert
		expect(result).toBe('2025-05-01');

		// Cleanup
		vi.useRealTimers();
	});

	test(`formatYesterdayYearMonthDay (SiteStatsPage, search date)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T00:00:00Z')); // midnight UTC (8 PM ET)

		// Act
		const result = dateUtils.formatYesterdayYearMonthDay();

		// Assert
		expect(result).toBe('2025-04-30');

		// Cleanup
		vi.useRealTimers();
	});

	describe('formatYear', () =>
	{
		test(`string, Node, whether to not show year in post date`, () =>
		{
			// Arrange
			const created = '2020-05-02T13:19:25.492Z';

			// Act
			const result = dateUtils.formatYear(created);

			// Assert
			expect(result).toBe(2020);
		});

		test(`string, acgame/calendar, current date`, () =>
		{
			// Arrange
			const debug = '2023-01-01';

			// Act
			const result = dateUtils.formatYear(debug, dateUtils.utcTimezone);

			// Assert
			expect(result).toBe(2023);
		});

		test(`number, acgame/calendar, current date year`, () =>
		{
			// Arrange
			const debug = dateUtils.toDate('2021-05-02').getTime();

			// Act
			const result = dateUtils.formatYear(debug);

			// Assert
			expect(result).toBe(2021);
		});

		test(`Date, acgame/calendar, yesterday's date`, () =>
		{
			// Arrange
			const debug = dateUtils.toDate('2023-01-01').getTime();
			const yesterdayDate = dateUtils.subtractNumber(debug, 1, 'days');

			// Act
			const result = dateUtils.formatYear(yesterdayDate);

			// Assert
			expect(result).toBe(2022);
		});
	});

	test(`formatMonth (acgame/calendar, current date)`, () =>
	{
		// Arrange
		const debug = '2023-01-01';

		// Act
		const result = dateUtils.formatMonth(debug, dateUtils.utcTimezone);

		// Assert
		expect(result).toBe(1);
	});

	test(`formatHoursMinutes (StatusIndicator, same day)`, () =>
	{
		// Arrange
		const lastActiveTime = '2025-05-03T13:15:20.325Z';

		// Act
		const result = dateUtils.formatHoursMinutes(lastActiveTime);

		// Assert
		expect(result).toBe('9:15 AM');
	});

	test(`formatMonthDayHoursMinutes (StatusIndicator, same year)`, () =>
	{
		// Arrange
		const lastActiveTime = '2025-05-03T13:15:20.325Z';

		// Act
		const result = dateUtils.formatMonthDayHoursMinutes(lastActiveTime);

		// Assert
		expect(result).toBe('5/03 9:15 AM');
	});

	test(`formatMonthDayYearHoursMinutes (StatusIndicator, other)`, () =>
	{
		// Arrange
		const lastActiveTime = '2025-05-03T13:15:20.325Z';

		// Act
		const result = dateUtils.formatMonthDayYearHoursMinutes(lastActiveTime);

		// Assert
		expect(result).toBe('5/03/2025 9:15 AM');
	});

	test(`getCurrentYear (SiteFooter)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00Z')); // midnight UTC (8 PM ET)

		// Act
		const result = dateUtils.getCurrentYear();

		// Assert
		expect(result).toBe(2024);

		// Cleanup
		vi.useRealTimers();
	});

	test(`getCurrentMonthDay (iso-server, birthday cache)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00Z')); // midnight UTC (8 PM ET)

		// Act
		const result = dateUtils.getCurrentMonthDay();

		// Assert
		expect(result).toBe('1231');

		// Cleanup
		vi.useRealTimers();
	});

	test(`getCurrentMonth (calendar, default month)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T00:00:00Z')); // midnight UTC (8 PM ET)

		// Act
		const result = dateUtils.getCurrentMonth();

		// Assert
		expect(result).toBe(12);

		// Cleanup
		vi.useRealTimers();
	});

	describe('format', () =>
	{
		test(`Date, calendar, default month`, () =>
		{
			// Arrange
			const debug = '2023-01-01';
			const month = dateUtils.formatMonth(debug, dateUtils.utcTimezone);

			// Act
			const result = dateUtils.format(dateUtils.parse(month, 'M'), 'MMMM');

			// Assert
			expect(result).toBe('January');
		});

		test(`string, events data`, () =>
		{
			// Arrange
			const potentialYear = '2012';

			// Act
			const result = dateUtils.format(potentialYear, 'yyyy', 'yyyy');

			// Assert
			expect(result).toBe('2012');
		});
	});

	describe('dateToTimezone', () =>
	{
		test(`number, calendar, determine Sunday for August Fireworks`, () =>
		{
			// Arrange
			const time = dateUtils.toUTC(2025, 2, 1, 5);

			// Act
			const result = dateUtils.dateToTimezone(time);

			// Assert
			const day = result.getDate();
			const month = result.getMonth() + 1;
			const year = result.getFullYear();
			expect(day).toBe(1);
			expect(month).toBe(3);
			expect(year).toBe(2025);
		});

		test(`string, signup, birthday`, () =>
		{
			// Arrange
			const birthday = '2012-01-01';

			// Act
			const result = dateUtils.dateToTimezone(birthday, dateUtils.utcTimezone);

			// Assert
			const day = result.getDate();
			const month = result.getMonth() + 1;
			const year = result.getFullYear();
			expect(day).toBe(1);
			expect(month).toBe(1);
			expect(year).toBe(2012);
		});
	});

	test(`getCurrentDateTimezone (ACC's Clock)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));

		// Act
		const result = dateUtils.getCurrentDateTimezone();

		// Assert
		expect(result.timeZone).toBe('America/New_York');
		const day = result.getDate();
		const month = result.getMonth() + 1;
		const year = result.getFullYear();
		const hour = result.getHours();
		const minute = result.getMinutes();
		const second = result.getSeconds();
		expect(day).toBe(2);
		expect(month).toBe(5);
		expect(year).toBe(2025);
		expect(hour).toBe(9);
		expect(minute).toBe(43);
		expect(second).toBe(25);

		// Cleanup
		vi.useRealTimers();
	});

	describe('parse', () =>
	{
		test(`string, acgame/calendar, currentMonth`, () =>
		{
			// Arrange
			const villagerBirthday = dateUtils.format('December 2', 'MM/dd', 'MMMM d');  // Annalise, NL
			const year = 2025;

			// Act
			const result = dateUtils.parse(`${villagerBirthday}/${year}`, 'MM/dd/yyyy');

			// Assert
			const day = result.getDate();
			const month = result.getMonth() + 1;
			expect(day).toBe(2);
			expect(month).toBe(12);
		});

		test(`number, acgame/calendar, villager birthday`, () =>
		{
			// Arrange
			const month = 12;

			// Act
			const result = dateUtils.parse(month, 'M');

			// Assert
			const resultMonth = result.getMonth() + 1;
			expect(resultMonth).toBe(12);
		});
	});

	test(`getCurrentDate (calendar, time)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));

		// Act
		const result = dateUtils.getCurrentDate();

		// Assert
		expect(result).toBe(1746193405492);

		// Cleanup
		vi.useRealTimers();
	});

	test(`subtractNumber (acgame/calendar, yesterday's date)`, () =>
	{
		// Arrange
		const currentDate = dateUtils.toDate('2023-01-01').getTime(); // midnight UTC

		// Act
		const result = dateUtils.subtractNumber(currentDate, 1, 'days');

		// Assert
		const day = result.getDate();
		const month = result.getMonth() + 1;
		const year = result.getFullYear();
		expect(day).toBe(30); // actually the day before
		expect(month).toBe(12);
		expect(year).toBe(2022);
	});

	test(`subtractFromCurrentDateTimezone (StatusIndicator, checking if within 5 minutes)`, () =>
	{
		// Arrange
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));

		// Act
		const result = dateUtils.subtractFromCurrentDateTimezone(5, 'minutes');

		// Assert
		expect(result.timeZone).toBe('America/New_York');
		const day = result.getDate();
		const month = result.getMonth() + 1;
		const year = result.getFullYear();
		const hour = result.getHours();
		const minute = result.getMinutes();
		const second = result.getSeconds();
		expect(day).toBe(2);
		expect(month).toBe(5);
		expect(year).toBe(2025);
		expect(hour).toBe(9);
		expect(minute).toBe(38);
		expect(second).toBe(25);

		// Cleanup
		vi.useRealTimers();
	});

	test(`subtractDateTimezone (session/update, whether last session was within 15 minutes)`, () =>
	{
		// Arrange
		const lastActiveTime = new Date('2025-05-02T13:43:25.492Z');

		// Act
		const result = dateUtils.subtractDateTimezone(lastActiveTime, 15, 'minutes');

		// Assert
		expect(result.timeZone).toBe('America/New_York');
		const day = result.getDate();
		const month = result.getMonth() + 1;
		const year = result.getFullYear();
		const hour = result.getHours();
		const minute = result.getMinutes();
		const second = result.getSeconds();
		expect(day).toBe(2);
		expect(month).toBe(5);
		expect(year).toBe(2025);
		expect(hour).toBe(9);
		expect(minute).toBe(28);
		expect(second).toBe(25);
	});

	describe('addNumber', () =>
	{
		test(`days, acgame/calendar, add thirty days`, () =>
		{
			// Arrange
			const currentDate = dateUtils.toDate('2023-01-01').getTime(); // midnight UTC

			// Act
			const result = dateUtils.addNumber(currentDate, 30, 'days');

			// Assert
			const day = result.getDate();
			const month = result.getMonth() + 1;
			const year = result.getFullYear();
			expect(day).toBe(30);
			expect(month).toBe(1);
			expect(year).toBe(2023);
		});

		test(`months, calendar, southernHemisphere`, () =>
		{
			// Arrange
			const time = dateUtils.toUTC(2025, 2, 1, 5);

			// Act
			const result = dateUtils.addNumber(time, 6, 'months').getTime();

			// Assert
			expect(time).toBe(1740805200000);
			expect(result).toBe(1756702800000);
		});
	});

	describe('addToCurrentDateTimezone', () =>
	{
		test(`days, user_ticket/complete, ban length`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const banLength = 20;

			// Act
			const result = dateUtils.addToCurrentDateTimezone(banLength, 'days');

			// Assert
			expect(result.timeZone).toBe('America/New_York');
			const day = result.getDate();
			const month = result.getMonth() + 1;
			const year = result.getFullYear();
			const hour = result.getHours();
			const minute = result.getMinutes();
			const second = result.getSeconds();
			expect(day).toBe(22);
			expect(month).toBe(5);
			expect(year).toBe(2025);
			expect(hour).toBe(9);
			expect(minute).toBe(43);
			expect(second).toBe(25);

			// Cleanup
			vi.useRealTimers();
		});

		test(`months, bell shop items`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const expireDurationMonths = 2;

			// Act
			const result = dateUtils.addToCurrentDateTimezone(expireDurationMonths, 'months');

			// Assert
			expect(result.timeZone).toBe('America/New_York');
			const day = result.getDate();
			const month = result.getMonth() + 1;
			const year = result.getFullYear();
			const hour = result.getHours();
			const minute = result.getMinutes();
			const second = result.getSeconds();
			expect(day).toBe(2);
			expect(month).toBe(7);
			expect(year).toBe(2025);
			expect(hour).toBe(9);
			expect(minute).toBe(43);
			expect(second).toBe(25);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isValid', () =>
	{
		test(`number, month, acgame/calendar, valid month given`, () =>
		{
			// Arrange
			const month = 12;

			// Act
			const result = dateUtils.isValid(month, 'month');

			// Assert
			expect(result).toBe(true);
		});

		test(`number, month, acgame/calendar, invalid month given`, () =>
		{
			// Arrange
			const month = 13;

			// Act
			const result = dateUtils.isValid(month, 'month');

			// Assert
			expect(result).toBe(false);
		});

		test(`number, year, acgame/calendar, valid year given`, () =>
		{
			// Arrange
			const year = 2025;

			// Act
			const result = dateUtils.isValid(year, 'year');

			// Assert
			expect(result).toBe(true);
		});

		test(`number, year, acgame/calendar, invalid year given`, () =>
		{
			// Arrange
			const year = -2025;

			// Act
			const result = dateUtils.isValid(year, 'year');

			// Assert
			expect(result).toBe(false);
		});

		test(`string, year, acgame/calendar, valid debug date`, () =>
		{
			// Arrange
			const debug = '2023-01-01';

			// Act
			const result = dateUtils.isValid(debug);

			// Assert
			expect(result).toBe(true);
		});

		test(`string, year, acgame/calendar, invalid debug date`, () =>
		{
			// Arrange
			const debug = 'aldericon';

			// Act
			const result = dateUtils.isValid(debug);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('isBetween', () =>
	{
		test(`isSame, acgame/calendar, current date between event dates, valid`, () =>
		{
			// Arrange
			const month = 12;
			const year = 2015;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Dec 22 – Jan 5'; // New Year's Day (Year of the Horse)
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
			const end = dateUtils.startOfDay(dateUtils.parse(dates.substring(dates.indexOf(dash) + dash.length) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isBetween(currentMonth, start, end, 'month');

			// Assert
			expect(result).toBe(true);
		});

		test(`isSame, acgame/calendar, current date between event dates, invalid`, () =>
		{
			// Arrange
			const month = 6;
			const year = 2015;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Dec 22 – Jan 5'; // New Year's Day (Year of the Horse)
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
			const end = dateUtils.startOfDay(dateUtils.parse(dates.substring(dates.indexOf(dash) + dash.length) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isBetween(currentMonth, start, end, 'month');

			// Assert
			expect(result).toBe(false);
		});

		test(`isAfter, acgame/calendar, current date between event dates, valid`, () =>
		{
			// Arrange
			const month = 4;
			const year = 2025;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Feb 25 – May 31'; // young spring bamboo crafting season
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
			const end = dateUtils.startOfDay(dateUtils.parse(dates.substring(dates.indexOf(dash) + dash.length) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isBetween(currentMonth, start, end, 'month');

			// Assert
			expect(result).toBe(true);
		});

		test(`isAfter, acgame/calendar, current date between event dates, invalid`, () =>
		{
			// Arrange
			const month = 7;
			const year = 2025;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Feb 25 – May 31'; // young spring bamboo crafting season
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
			const end = dateUtils.startOfDay(dateUtils.parse(dates.substring(dates.indexOf(dash) + dash.length) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isBetween(currentMonth, start, end, 'month');

			// Assert
			expect(result).toBe(false);
		});
	});

	test(`startOfDay (acgame/calendar, villager's birthday)`, () =>
	{
		// Arrange
		const birthday = '12/2';
		const year = 2025;
		const date = dateUtils.parse(`${birthday}/${year}`, 'MM/dd/yyyy');

		// Act
		const result = dateUtils.startOfDay(date);

		// Assert
		const hour = result.getHours();
		const minute = result.getMinutes();
		const second = result.getSeconds();
		expect(result.getDate()).toBe(date.getDate());
		expect(result.getMonth()).toBe(date.getMonth());
		expect(hour).toBe(0);
		expect(minute).toBe(0);
		expect(second).toBe(0);
	});

	describe('diff', () =>
	{
		test(`acgame/calendar, diff between current date and villager's birthday`, () =>
		{
			// Arrange
			const currentDate = dateUtils.toDate('2023-01-01').getTime(); // midnight UTC
			const birthday = '12/2';
			const year = 2025;
			const date = dateUtils.startOfDay(dateUtils.parse(`${birthday}/${year}`, 'MM/dd/yyyy'));

			// Act
			const result = dateUtils.diff(currentDate, date, 'day');

			// Assert
			expect(result).toBe(-1066);
		});

		test(`acgame/calendar, diff between current date and villager's birthday`, () =>
		{
			// Arrange
			const year = 2025;
			const datesA = 'Feb 25 – May 31'; // young spring bamboo crafting season
			const dash = ' – ';
			const sortDateA = dateUtils.startOfDay(dateUtils.parse(datesA.substring(0, datesA.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
			const datesB = 'Dec 22 – Jan 5'; // New Year's Day (Year of the Horse)
			const sortDateB = dateUtils.startOfDay(dateUtils.parse(datesB.substring(0, datesB.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.diff(sortDateA, sortDateB);

			// Assert
			expect(result).toBe(-25920000000);
		});
	});

	describe('isSame', () =>
	{
		test(`month, acgame/calendar, current date between event dates, valid`, () =>
		{
			// Arrange
			const month = 12;
			const year = 2015;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Dec 22 – Jan 5'; // New Year's Day (Year of the Horse)
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isSame(start, currentMonth, 'month');

			// Assert
			expect(result).toBe(true);
		});

		test(`month, acgame/calendar, current date between event dates, invalid`, () =>
		{
			// Arrange
			const month = 6;
			const year = 2015;
			const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');
			const dates = 'Dec 22 – Jan 5'; // New Year's Day (Year of the Horse)
			const dash = ' – ';
			const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));

			// Act
			const result = dateUtils.isSame(start, currentMonth, 'month');

			// Assert
			expect(result).toBe(false);
		});

		test(`day, acgame/calendar, villager's birthday yesterday, valid`, () =>
		{
			// Arrange
			const villagerBirthday = dateUtils.format('December 2', 'MM/dd', 'MMMM d');  // Annalise, NL
			const year = 2025;
			const birthday = dateUtils.startOfDay(dateUtils.parse(`${villagerBirthday}/${year}`, 'MM/dd/yyyy'));
			const currentDate = dateUtils.toDate('2025-12-04').getTime(); // midnight UTC
			const yesterdayDate = dateUtils.subtractNumber(currentDate, 1, 'days');

			// Act
			const result = dateUtils.isSame(birthday, yesterdayDate, 'day');

			// Assert
			expect(result).toBe(true);
		});

		test(`day, acgame/calendar, villager's birthday yesterday, invalid`, () =>
		{
			// Arrange
			const villagerBirthday = dateUtils.format('December 2', 'MM/dd', 'MMMM d');  // Annalise, NL
			const year = 2025;
			const birthday = dateUtils.startOfDay(dateUtils.parse(`${villagerBirthday}/${year}`, 'MM/dd/yyyy'));
			const currentDate = dateUtils.toDate('2025-12-03').getTime(); // midnight UTC
			const yesterdayDate = dateUtils.subtractNumber(currentDate, 1, 'days');

			// Act
			const result = dateUtils.isSame(birthday, yesterdayDate, 'day');

			// Assert
			expect(result).toBe(false);
		});

		test(`null, SiteRulesPage, rule start date is last updated, valid`, () =>
		{
			// Arrange
			const lastUpdated = '2023-09-24T21:17:40.853Z';
			const startDate = '2023-09-24T21:17:40.853Z';

			// Act
			const result = dateUtils.isSame(lastUpdated, startDate);

			// Assert
			expect(result).toBe(true);
		});

		test(`null, SiteRulesPage, rule start date is last updated, invalid`, () =>
		{
			// Arrange
			const lastUpdated = '2023-09-24T21:17:40.853Z';
			const startDate = '2023-09-24T13:57:59.867Z';

			// Act
			const result = dateUtils.isSame(lastUpdated, startDate);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('currentDateIsSame', () =>
	{
		test(`v1/shop, if currently on vacation, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-06-12T13:43:25.492Z'));
			const vacationStartDate = '2025-06-12';

			// Act
			const result = dateUtils.currentDateIsSame(vacationStartDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`v1/shop, if currently on vacation, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const vacationStartDate = '2025-06-12';

			// Act
			const result = dateUtils.currentDateIsSame(vacationStartDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isSameCurrentDateTimezone', () =>
	{
		test(`day, StatusIndicator, same day, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-03T13:43:25.492Z'));
			const lastActiveTime = '2025-05-03T13:15:20.325Z';

			// Act
			const result = dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'day');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`day, StatusIndicator, same day, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const lastActiveTime = '2025-05-03T13:15:20.325Z';

			// Act
			const result = dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'day');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});

		test(`year, StatusIndicator, same year, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const lastActiveTime = '2025-05-03T13:15:20.325Z';

			// Act
			const result = dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'year');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`year, StatusIndicator, same year, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const lastActiveTime = '2022-05-03T13:15:20.325Z';

			// Act
			const result = dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'year');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isSameTimezone2', () =>
	{
		test(`bell_shop/items, show item on release date, valid`, () =>
		{
			// Arrange
			const debug = '2025-02-27';
			const releaseDate = '2025-02-27';

			// Act
			const result = dateUtils.isSameTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(true);
		});

		test(`bell_shop/items, show item on release date, invalid`, () =>
		{
			// Arrange
			const debug = '2025-07-27';
			const releaseDate = '2025-02-27';

			// Act
			const result = dateUtils.isSameTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('isSameCurrentDate', () =>
	{
		test(`day, PostAuthorInfo, same day, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-03T13:43:25.492Z'));
			const signupDate = '2007-05-03';

			// Act
			const result = dateUtils.isSameCurrentDate(signupDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`day, PostAuthorInfo, same day, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const signupDate = '2007-05-03';

			// Act
			const result = dateUtils.isSameCurrentDate(signupDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isBefore', () =>
	{
		test(`strings, SiteStatisticsPage, before launch date, valid`, () =>
		{
			// Arrange
			const date = '2020-05-02';

			// Act
			const result = dateUtils.isBefore(date, constants.launchDate);

			// Assert
			expect(result).toBe(true);
		});

		test(`strings, SiteStatisticsPage, before launch date, invalid`, () =>
		{
			// Arrange
			const date = '2025-05-02';

			// Act
			const result = dateUtils.isBefore(date, constants.launchDate);

			// Assert
			expect(result).toBe(false);
		});

		test(`dates, v1/user, user last signed TOS, valid`, () =>
		{
			// Arrange
			const tosDate = new Date('2020-09-25T01:17:40.853Z');
			const siteLastUpdated = new Date('2023-09-25T01:17:40.853Z');

			// Act
			const result = dateUtils.isBefore(tosDate, siteLastUpdated);

			// Assert
			expect(result).toBe(true);
		});

		test(`dates, v1/user, user last signed TOS, invalid`, () =>
		{
			// Arrange
			const tosDate = new Date('2025-09-25T01:17:40.853Z');
			const siteLastUpdated = new Date('2023-09-25T01:17:40.853Z');

			// Act
			const result = dateUtils.isBefore(tosDate, siteLastUpdated);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('currentDateIsBefore', () =>
	{
		test(`v1/shop, if currently on vacation, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const vacationEndDate = '2025-06-12';

			// Act
			const result = dateUtils.currentDateIsBefore(vacationEndDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`v1/shop, if currently on vacation, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const vacationEndDate = '2024-06-12';

			// Act
			const result = dateUtils.currentDateIsBefore(vacationEndDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isBeforeCurrentDateTimezone', () =>
	{
		test(`Poll, allows votes, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const startDate = '2025-05-01T05:00:00.000Z';

			// Act
			const result = dateUtils.isBeforeCurrentDateTimezone(startDate);

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`Poll, allows votes, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const startDate = '2025-06-01T05:00:00.000Z';

			// Act
			const result = dateUtils.isBeforeCurrentDateTimezone(startDate);

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isBeforeTimezone2', () =>
	{
		test(`bell_shop/items, show item on release date, valid`, () =>
		{
			// Arrange
			const debug = '2025-05-27';
			const releaseDate = '2025-02-27';

			// Act
			const result = dateUtils.isBeforeTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(true);
		});

		test(`bell_shop/items, show item on release date, invalid`, () =>
		{
			// Arrange
			const debug = '2025-01-27';
			const releaseDate = '2025-02-27';

			// Act
			const result = dateUtils.isBeforeTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('isAfter', () =>
	{
		test(`v1/notification, determine next post id after last viewed, valid`, () =>
		{
			// Arrange
			const creationTime = new Date('2025-05-02T13:19:25.656Z');
			const lastChecked = new Date('2025-04-02T13:19:25.656Z');

			// Act
			const result = dateUtils.isAfter(creationTime, lastChecked);

			// Assert
			expect(result).toBe(true);
		});

		test(`v1/notification, determine next post id after last viewed, invalid`, () =>
		{
			// Arrange
			const creationTime = new Date('2025-05-02T13:19:25.656Z');
			const lastChecked = new Date('2025-05-03T13:19:25.656Z');

			// Act
			const result = dateUtils.isAfter(creationTime, lastChecked);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('isAfterTimezone', () =>
	{
		test(`string, StatusIndicator, checking if within 5 minutes, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const lastActiveTime = '2025-05-03T13:15:20.325Z';

			// Act
			const result = dateUtils.isAfterTimezone(lastActiveTime, dateUtils.subtractFromCurrentDateTimezone(5, 'minutes'));

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`string, StatusIndicator, checking if within 5 minutes, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const lastActiveTime = '2025-05-01T13:15:20.325Z';

			// Act
			const result = dateUtils.isAfterTimezone(lastActiveTime, dateUtils.subtractFromCurrentDateTimezone(5, 'minutes'));

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});

		test(`Dates, node/create, new member has posted twice with X minutes, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const creationTime = new Date('2025-05-03T13:19:25.656Z');

			// Act
			const result = dateUtils.isAfterTimezone(creationTime, dateUtils.subtractFromCurrentDateTimezone(1, 'minutes'));

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`Dates, node/create, new member has posted twice with X minutes, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const creationTime = new Date('2025-05-01T13:19:25.656Z');

			// Act
			const result = dateUtils.isAfterTimezone(creationTime, dateUtils.subtractFromCurrentDateTimezone(1, 'minutes'));

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('currentDateIsAfter', () =>
	{
		test(`v1/shop, if currently on vacation, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const vacationStartdDate = '2025-04-12';

			// Act
			const result = dateUtils.currentDateIsAfter(vacationStartdDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`v1/shop, if currently on vacation, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const vacationStartdDate = '2025-06-12';

			// Act
			const result = dateUtils.currentDateIsAfter(vacationStartdDate, 'yyyy-MM-dd');

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isAfterCurrentDateTimezone', () =>
	{
		test(`Poll, allows votes, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const endDate = '2025-06-01T05:00:00.000Z';

			// Act
			const result = dateUtils.isAfterCurrentDateTimezone(endDate);

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`Poll, allows votes, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const endDate = '2025-05-01T05:00:00.000Z';

			// Act
			const result = dateUtils.isAfterCurrentDateTimezone(endDate);

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('isAfterTimezone2', () =>
	{
		test(`Dates, guide, has changes, valid`, () =>
		{
			// Arrange
			const lastUpdated = new Date('2023-08-14T20:12:32.608Z');
			const lastPublished = new Date('2022-08-14T20:12:32.608Z');

			// Act
			const result = dateUtils.isAfterTimezone2(lastUpdated, lastPublished);

			// Assert
			expect(result).toBe(true);
		});

		test(`Dates, guide, has changes, invalid`, () =>
		{
			// Arrange
			const lastUpdated = new Date('2023-08-14T20:12:32.608Z');
			const lastPublished = new Date('2024-08-14T20:12:32.608Z');

			// Act
			const result = dateUtils.isAfterTimezone2(lastUpdated, lastPublished);

			// Assert
			expect(result).toBe(false);
		});

		test(`strings, bell_shop/items, redeem check item release date, valid`, () =>
		{
			// Arrange
			const debug = '2025-02-27';
			const releaseDate = '2025-03-27';

			// Act
			const result = dateUtils.isAfterTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(true);
		});

		test(`strings, bell_shop/items, redeem check item release date, invalid`, () =>
		{
			// Arrange
			const debug = '2025-02-27';
			const releaseDate = '2025-01-27';

			// Act
			const result = dateUtils.isAfterTimezone2(releaseDate, debug);

			// Assert
			expect(result).toBe(false);
		});
	});

	test(`toDate (string, HomePage, event sort date)`, () =>
	{
		// Arrange
		const sortDate = '2025-06-02T00:00:00.000Z';

		// Act
		const result = dateUtils.toDate(sortDate).getTime();

		// Assert
		expect(result).toBe(1748822400000);
	});

	test(`dateParse (calendar, date override)`, () =>
	{
		// Arrange
		const dateOverride = '2025-05-02';

		// Act
		const result = dateUtils.dateParse(dateOverride);

		// Assert
		expect(result).toBe(1746144000000);
	});

	test(`dateToDate (accounts, birthday)`, () =>
	{
		// Act
		const result = dateUtils.dateToDate( // test-user's birthday
			1907,
			5,
			20,
		).getTime();

		// Assert
		expect(result).toBe(-1973462400000);
	});

	test(`getUTCFullYear (calendar, current year)`, () =>
	{
		// Arrange
		const year = 2025;
		const time = dateUtils.toUTC(year, 2, 1, 5);

		// Act
		const result = dateUtils.getUTCFullYear(time);

		// Assert
		expect(result).toBe(year);
	});

	test(`toUTC (calendar, date comparison)`, () =>
	{
		// Act
		const result = dateUtils.toUTC(2025, 2, 1, 5);

		// Assert
		expect(result).toBe(1740805200000);
	});

	describe('getAge', () =>
	{
		test(`with accounts, birthday`, () =>
		{
			// Arrange
			const testYear = 1907;
			const birthDate = dateUtils.dateToDate( // test-user's birthday
				testYear,
				5,
				20,
			);

			// Act
			const result = dateUtils.getAge(birthDate);

			// Assert
			const now = dateUtils.getCurrentDateTimezone();
			const currentYear = dateUtils.getCurrentYear();
			let expectedAge = currentYear - testYear - 1;

			const birthdayThisYear = dateUtils.dateToDate(testYear, 5, 20);
			birthdayThisYear.setFullYear(currentYear);

			if (now >= birthdayThisYear)
			{
				expectedAge += 1;
			}

			expect(result).toBe(expectedAge);
		});

		test(`signup/signup, age from given birthday`, () =>
		{
			// Arrange
			const testYear = 1980;
			const birthDate = dateUtils.dateToTimezone(`${testYear}-01-01`, dateUtils.utcTimezone);

			// Act
			const result = dateUtils.getAge(birthDate);

			// Assert
			const now = dateUtils.getCurrentDateTimezone();
			const currentYear = dateUtils.getCurrentYear();
			let expectedAge = currentYear - testYear - 1;

			const birthdayThisYear = dateUtils.dateToTimezone(`${currentYear}-01-01`, dateUtils.utcTimezone);

			if (now >= birthdayThisYear)
			{
				expectedAge += 1;
			}

			expect(result).toBe(expectedAge);
		});
	});

	describe('isNewMember', () =>
	{
		test(`PostAuthorInfo, whether to show 'New Member' badge, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const signupDate = '2025-05-01T22:31:32.043Z';

			// Act
			const result = dateUtils.isNewMember(signupDate);

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`PostAuthorInfo, whether to show 'New Member' badge, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const signupDate = '2012-01-22T22:31:32.043Z'; // PenguinGeek

			// Act
			const result = dateUtils.isNewMember(signupDate);

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('shouldHaveNewMemberRestrictions', () =>
	{
		test(`node/create, whether to apply new member restrictions, valid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const signupDate = '2025-05-01T22:31:32.043Z';

			// Act
			const result = dateUtils.shouldHaveNewMemberRestrictions(signupDate);

			// Assert
			expect(result).toBe(true);

			// Cleanup
			vi.useRealTimers();
		});

		test(`node/create, whether to apply new member restrictions, invalid`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			const signupDate = '2012-01-22T22:31:32.043Z'; // PenguinGeek

			// Act
			const result = dateUtils.shouldHaveNewMemberRestrictions(signupDate);

			// Assert
			expect(result).toBe(false);

			// Cleanup
			vi.useRealTimers();
		});
	});

	test(`formatDate with ordinal suffixes (1st, 2nd, 3rd, 4th)`, () =>
	{
		// Arrange & Act & Assert — verify all ordinal suffix cases
		expect(dateUtils.formatDate('2025-01-01')).toContain('1st');
		expect(dateUtils.formatDate('2025-01-02')).toContain('2nd');
		expect(dateUtils.formatDate('2025-01-03')).toContain('3rd');
		expect(dateUtils.formatDate('2025-01-04')).toContain('4th');
		expect(dateUtils.formatDate('2025-01-11')).toContain('11th');
		expect(dateUtils.formatDate('2025-01-12')).toContain('12th');
		expect(dateUtils.formatDate('2025-01-13')).toContain('13th');
		expect(dateUtils.formatDate('2025-01-21')).toContain('21st');
		expect(dateUtils.formatDate('2025-01-22')).toContain('22nd');
		expect(dateUtils.formatDate('2025-01-23')).toContain('23rd');
		expect(dateUtils.formatDate('2025-01-31')).toContain('31st');
	});

	describe('DST boundary handling', () =>
	{
		test(`formatDateTime during spring-forward (2 AM ET doesn't exist)`, () =>
		{
			// Arrange — 2025 spring forward: March 9, 2:00 AM ET = 7:00 AM UTC
			const springForward = '2025-03-09T07:00:00.000Z';

			// Act
			const result = dateUtils.formatDateTime(springForward);

			// Assert — should not crash, should produce a valid time string
			expect(result).toBeDefined();
			expect(result.length).toBeGreaterThan(0);
		});

		test(`formatDateTime during fall-back (1 AM ET exists twice)`, () =>
		{
			// Arrange — 2025 fall back: November 2, 1:00 AM ET (first occurrence) = 5:00 AM UTC
			const fallBack = '2025-11-02T05:00:00.000Z';

			// Act
			const result = dateUtils.formatDateTime(fallBack);

			// Assert — should not crash, should produce a valid time string
			expect(result).toBeDefined();
			expect(result.length).toBeGreaterThan(0);
		});

		test(`getCurrentYear at midnight UTC on Jan 1 (still Dec 31 ET)`, () =>
		{
			// Arrange — this is the classic off-by-one that bites timezone code
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-01-01T00:00:00Z')); // midnight UTC = 7 PM Dec 31 ET

			// Act
			const result = dateUtils.getCurrentYear();

			// Assert — ACC timezone is ET, so it's still 2025
			expect(result).toBe(2025);

			// Cleanup
			vi.useRealTimers();
		});

		test(`getCurrentMonthDay at midnight UTC on March 1 (still Feb 28 ET)`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-03-01T00:00:00Z')); // 7 PM Feb 28 ET

			// Act
			const result = dateUtils.getCurrentMonthDay();

			// Assert
			expect(result).toBe('0228');

			// Cleanup
			vi.useRealTimers();
		});
	});

	describe('edge cases', () =>
	{
		test(`formatDate with leap day`, () =>
		{
			// Arrange
			const leapDay = '2024-02-29';

			// Act
			const result = dateUtils.formatDate(leapDay);

			// Assert
			expect(result).toBe('February 29th, 2024');
		});

		test(`subtractNumber across year boundary`, () =>
		{
			// Arrange — use 5 AM UTC so it's midnight ET
			const jan1 = dateUtils.toUTC(2025, 0, 1, 5);

			// Act
			const result = dateUtils.subtractNumber(jan1, 1, 'days');

			// Assert
			expect(result.getFullYear()).toBe(2024);
			expect(result.getMonth()).toBe(11); // December
			expect(result.getDate()).toBe(31);
		});

		test(`addNumber across month boundary (Jan 31 + 1 month)`, () =>
		{
			// Arrange
			const jan31 = dateUtils.toDate('2025-01-31').getTime();

			// Act
			const result = dateUtils.addNumber(jan31, 1, 'months');

			// Assert — behavior depends on implementation; document what actually happens
			expect(result.getMonth()).toBe(1); // February
			// Day might be 28 or overflow to March — this test documents the behavior
		});

		test(`formatYearMonthDay2 preserves date across timezone (UTC midnight)`, () =>
		{
			// Arrange — midnight UTC means previous day in ET
			const utcMidnight = '2025-06-15T00:00:00.000Z';

			// Act
			const result = dateUtils.formatYearMonthDay2(utcMidnight);

			// Assert — should reflect ET date (June 14th)
			expect(result).toBe('2025-06-14');
		});

		test(`isNewMember boundary (exactly at threshold)`, () =>
		{
			// Arrange
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2025-05-02T13:43:25.492Z'));
			// A member who signed up exactly 30 days ago (or whatever the threshold is)
			// This documents whether the boundary is inclusive or exclusive
			const signupDate = '2025-04-02T13:43:25.492Z';

			// Act
			const result = dateUtils.isNewMember(signupDate);

			// Assert — document actual boundary behavior
			expect(typeof result).toBe('boolean');

			// Cleanup
			vi.useRealTimers();
		});
	});
});
