// This file is for date functions throughout the site.

import { format as dateFNSFormat , utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import {
	subDays,
	parse as dateFNSParse,
	differenceInDays,
	startOfDay as dateFNSStartOfDay,
	subMinutes,
	addDays,
	addMonths,
	isValid as dateFNSIsValid,
	isEqual,
	isAfter as dateFNSIsAfter,
	isBefore as dateFNSIsBefore,
	isSameMonth,
	isSameDay,
	isSameYear
} from 'date-fns';

import * as constants from './constants.js';

const timezone = 'America/New_York';
export const utcTimezone = 'UTC';

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDate(date)
{
	return dateFNSFormat(dateToTimezone(date, utcTimezone), 'MMMM do, y', { timeZone: utcTimezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTimezone(date)
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y', { timeZone: timezone });
}

/**
 * @param {Date|Number}
 * @returns {String}
 */
export function formatDate2(date)
{
	return dateFNSFormat(date, 'EEE, MMM d');
}

/**
 * @param {Date}
 * @returns {String}
 */
export function formatDateWithoutYear(date)
{
	return dateFNSFormat(date, 'MMMM do', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTime(date)
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y h:mm a', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTime2(date)
{
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM h:mmaaa', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTime3(date)
{
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM Y h:mmaaa', { timeZone: timezone });
}

/**
 * @param {Date|Number|String} date Should already be converted to timezone format.
 * @returns {String}
 */
export function formatDateTime4(date)
{
	return dateFNSFormat(date, 'M/d (EEE), h:mm a', { timeZone: timezone });
}

/**
 * A datetime that needs to show only the date.
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTime5(date)
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatDateTime6(date)
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, h:mm a', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatYearMonthDay(date)
{
	return dateFNSFormat(toDate(date), 'yyyy-MM-dd');
}

/**
 * A datetime that needs to show only the date.
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatYearMonthDay2(date)
{
	return dateFNSFormat(dateToTimezone(date), 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * @returns {String}
 */
export function formatCurrentDateYearMonthDay()
{
	return dateFNSFormat(getCurrentDateTimezone(), 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * @returns {String}
 */
export function formatYesterdayYearMonthDay()
{
	return dateFNSFormat(subtractFromCurrentDateTimezone(1, 'days'), 'yyyy-MM-dd', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatYear(date)
{
	return dateFNSFormat(dateToTimezone(date), 'y', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatMonth(date)
{
	return dateFNSFormat(toDate(date), 'M');
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatHoursMinutes(date)
{
	return dateFNSFormat(dateToTimezone(date), 'h:mm a', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatMonthDayHoursMinutes(date)
{
	return dateFNSFormat(dateToTimezone(date), 'M/dd h:mm a', { timeZone: timezone });
}

/**
 * @param {Date|Number|String}
 * @returns {String}
 */
export function formatMonthDayYearHoursMinutes(date)
{
	return dateFNSFormat(dateToTimezone(date), 'M/dd/yyyy h:mm a', { timeZone: timezone });
}

/**
 * @returns {String}
 */
export function getCurrentYear()
{
	return dateFNSFormat(getCurrentDateTimezone(), 'y', { timeZone: timezone });
}

/**
 * @returns {String}
 */
export function getCurrentMonthDay()
{
	return dateFNSFormat(getCurrentDateTimezone(), 'MMdd', { timeZone: timezone });
}

/**
 * @returns {String}
 */
export function getCurrentMonth()
{
	return dateFNSFormat(getCurrentDateTimezone(), 'M', { timeZone: timezone });
}

/**
 * @param {String|Date}
 * @param {String}
 * @param {String}
 * @returns {Date}
 */
export function format(date, format, readFormat = null)
{
	if (typeof date === 'string')
	{
		date = parse(date, readFormat);
	}

	return dateFNSFormat(date, format);
}

/**
 * @param {Date|Number|String}
 * @returns {Date}
 */
export function dateToTimezone(date, useTimezone = timezone)
{
	return utcToZonedTime(toDate(date), useTimezone);
}

/**
 * @returns {Date}
 */
export function getCurrentDateTimezone()
{
	return utcToZonedTime(new Date(), timezone);
}

/**
 * @returns {Date}
 */
export function getCurrentDayTimezone()
{
	return new Date(utcToZonedTime(new Date(), timezone).setHours(0, 0, 0, 0));
}

/**
 * @param {String}
 * @param {String}
 * @returns {Date}
 */
export function parse(date, readFormat = null)
{
	if (readFormat === null)
	{
		return toDate(date);
	}

	return dateFNSParse(date, readFormat, new Date());
}

/**
 * @returns {Number}
 */
export function getCurrentDate()
{
	return Date.now();
}

/**
 * @param {Date|Number}
 * @param {Number}
 * @param {String}
 * @returns {Date}
 */
export function subtract(date, amount, type)
{
	if (type === 'days')
	{
		return subDays(date, amount);
	}
	else if (type === 'minutes')
	{
		return subMinutes(date, amount);
	}
}

/**
 * @param {Date|Number}
 * @param {Number}
 * @returns {Date}
 */
export function subtractFromCurrentDate(amount, type)
{
	return subtract(getCurrentDate(), amount, type);
}

/**
 * @param {Date|Number}
 * @param {Number}
 * @returns {Date}
 */
export function subtractFromCurrentDateTimezone(amount, type)
{
	return subtract(getCurrentDateTimezone(), amount, type);
}

/**
 * @param {Date|Number}
 * @param {Number}
 * @param {String}
 * @returns {Date}
 */
export function add(date, amount, type)
{
	if (type === 'days')
	{
		return addDays(date, amount);
	}
	else if (type === 'months')
	{
		return addMonths(date, amount);
	}
}

/**
 * @param {Date|Number}
 * @param {Number}
 * @returns {Date}
 */
export function addToCurrentDateTimezone(amount, type)
{
	return add(getCurrentDateTimezone(), amount, type);
}

/**
 * @param {String}
 * @param {String}
 * @returns {Boolean}
 */
export function isValid(date, readFormat = null)
{
	if (readFormat === 'month')
	{
		return dateFNSIsValid(parse(date, 'M'));
	}
	else if (readFormat === 'year')
	{
		return dateFNSIsValid(parse(date, 'yyyy'));
	}
	else if (readFormat !== null)
	{
		return dateFNSIsValid(parse(date, readFormat));
	}

	return dateFNSIsValid(new Date(date));
}

/**
 * @param {String}
 * @param {String}
 * @param {String}
 * @param {String}
 * @returns {Boolean}
 */
export function isBetween(date, start, end, type)
{
	if (type === 'month')
	{
		return isSame(date, start, 'month') || isSame(date, end, 'month') || (isAfter(date, start) && isBefore(date, end));
	}
}

/**
 * @param {Date|Number}
 * @returns {Date}
 */
export function startOfDay(date)
{
	return dateFNSStartOfDay(date);
}

/**
 * @param {Number|Date}
 * @param {Number|Date}
 * @returns {Number}
 */
export function diff(date1, date2, type = null)
{
	if (type === 'day')
	{
		return differenceInDays(date1, date2);
	}

	return date1 - date2;
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isSame(date1, date2, type = null)
{
	if (typeof date1 === 'string')
	{
		date1 = parse(date1);
	}

	if (typeof date2 === 'string')
	{
		date2 = parse(date2);
	}

	if (type === 'month')
	{
		return isSameMonth(date1, date2);
	}
	else if (type === 'day')
	{
		return isSameDay(date1, date2);
	}
	else if (type === 'year')
	{
		return isSameYear(date1, date2);
	}

	return isEqual(date1, date2);
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function currentDateIsSame(date, type = null)
{
	return isSame(date, getCurrentDayTimezone(), type);
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isSameCurrentDateTimezone(date, type = null)
{
	return isSame(dateToTimezone(date), getCurrentDateTimezone(), type);
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isSameTimezone2(date1, date2, type = null)
{
	return isSame(dateToTimezone(date1), dateToTimezone(date2), type);
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isBefore(date1, date2)
{
	if (typeof date1 === 'string')
	{
		date1 = parse(date1);
	}

	if (typeof date2 === 'string')
	{
		date2 = parse(date2);
	}

	return dateFNSIsBefore(date1, date2);
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function currentDateIsBefore(date)
{
	return isBefore(getCurrentDayTimezone(), date);
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isBeforeCurrentDateTimezone(date)
{
	return isBefore(dateToTimezone(date), getCurrentDateTimezone());
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isBeforeTimezone2(date1, date2)
{
	return isBefore(dateToTimezone(date1), dateToTimezone(date2));
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isAfter(date1, date2)
{
	if (typeof date1 === 'string')
	{
		date1 = parse(date1);
	}

	if (typeof date2 === 'string')
	{
		date2 = parse(date2);
	}

	return dateFNSIsAfter(date1, date2);
}

/**
 * @param {Number|Date|String}
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isAfterTimezone(date1, date2)
{
	return isAfter(dateToTimezone(date1), date2);
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function currentDateIsAfter(date)
{
	return isAfter(getCurrentDayTimezone(), date);
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isAfterCurrentDateTimezone(date)
{
	return isAfter(dateToTimezone(date), getCurrentDateTimezone());
}

/**
 * @param {Number|Date|String}
 * @returns {Boolean}
 */
export function isAfterTimezone2(date1, date2)
{
	return isAfter(dateToTimezone(date1), dateToTimezone(date2));
}

/**
 * @param {String|Number|Date}
 * @returns {Date}
 */
export function toDate(date)
{
	return new Date(date);
}

/**
 * @param {String|Number|Date}
 * @returns {Number}
 */
export function dateParse(date)
{
	return Date.parse(date);
}

/**
 * @param {Number}
 * @param {Number}
 * @param {Number}
 * @returns {Date}
 */
export function dateToDate(year, monthIndex, day)
{
	return new Date(year, monthIndex, day);
}

/**
 * @param {String|Number|Date}
 * @returns {Number} Year
 */
export function getUTCFullYear(date)
{
	return toDate(date).getUTCFullYear();
}

/**
 * @param {Number}
 * @param {Number}
 * @param {Number}
 * @param {Number}
 * @returns {Number}
 */
export function toUTC(year, monthIndex, day, hours)
{
	return Date.UTC(year, monthIndex, day, hours);
}

/**
 * @param {Date}
 * @returns {Number}
 */
export function getAge(birthDate)
{
	return Math.floor((new Date()-birthDate)/(1000*60*60*24*365.25));
}

/**
 * @param {Date|Number|String}
 * @returns {Boolean}
 */
export function isNewMember(signupDate)
{
	return isAfter(dateToTimezone(signupDate), subtractFromCurrentDateTimezone(constants.scoutHub.newMemberEligibility, 'days'));
}

/**
 * @param {Date|Number|String}
 * @returns {Boolean}
 */
export function shouldHaveNewMemberRestrictions(signupDate)
{
	return isAfter(dateToTimezone(signupDate), subtractFromCurrentDateTimezone(5, 'days'));
}