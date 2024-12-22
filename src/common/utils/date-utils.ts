// This file is for date functions throughout the site.

import { format as dateFNSFormat, utcToZonedTime } from 'date-fns-tz';
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
	isSameYear,
} from 'date-fns';

import * as constants from './constants.ts';

const timezone = 'America/New_York';
export const utcTimezone = 'UTC';

export function formatDate(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date, utcTimezone), 'MMMM do, y', { timeZone: utcTimezone });
}

export function formatDateTimezone(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y', { timeZone: timezone });
}

export function formatDate2(date: Date | number): string
{
	return dateFNSFormat(date, 'EEE, MMM d');
}

export function formatDateWithoutYear(date: Date): string
{
	return dateFNSFormat(date, 'MMMM do', { timeZone: timezone });
}

export function formatDateTime(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y h:mm a', { timeZone: timezone });
}

export function formatDateTime2(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM h:mmaaa', { timeZone: timezone });
}

export function formatDateTime3(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM Y h:mmaaa', { timeZone: timezone });
}

/**
 * @param date Should already be converted to timezone format.
 */
export function formatDateTime4(date: Date | number): string
{
	return dateFNSFormat(date, 'M/d (EEE), h:mm a', { timeZone: timezone });
}

/**
 * A datetime that needs to show only the date.
 */
export function formatDateTime5(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y', { timeZone: timezone });
}

export function formatDateTime6(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, h:mm a', { timeZone: timezone });
}

export function formatYearMonthDay(date: Date | number | string): string
{
	return dateFNSFormat(toDate(date), 'yyyy-MM-dd');
}

/**
 * A datetime that needs to show only the date.
 */
export function formatYearMonthDay2(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'yyyy-MM-dd', { timeZone: timezone });
}

export function formatCurrentDateYearMonthDay(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'yyyy-MM-dd', { timeZone: timezone });
}

export function formatYesterdayYearMonthDay(): string
{
	let date = subtractFromCurrentDateTimezone(1, 'days');

	if (date === null)
	{
		return '';
	}

	return dateFNSFormat(date, 'yyyy-MM-dd', { timeZone: timezone });
}

export function formatYear(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'y', { timeZone: timezone });
}

export function formatMonth(date: Date | number | string): string
{
	return dateFNSFormat(toDate(date), 'M');
}

export function formatHoursMinutes(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'h:mm a', { timeZone: timezone });
}

export function formatMonthDayHoursMinutes(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'M/dd h:mm a', { timeZone: timezone });
}

export function formatMonthDayYearHoursMinutes(date: Date | number | string): string
{
	return dateFNSFormat(dateToTimezone(date), 'M/dd/yyyy h:mm a', { timeZone: timezone });
}

export function getCurrentYear(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'y', { timeZone: timezone });
}

export function getCurrentMonthDay(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'MMdd', { timeZone: timezone });
}

export function getCurrentMonth(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'M', { timeZone: timezone });
}

export function format(date: number | Date | string, format: string, readFormat: string | null = null): string
{
	if (typeof date === 'string')
	{
		date = parse(date, readFormat);
	}

	return dateFNSFormat(date, format);
}

export function dateToTimezone(date: Date | number | string, useTimezone = timezone): Date
{
	return utcToZonedTime(toDate(date), useTimezone);
}

export function getCurrentDateTimezone(): Date
{
	return utcToZonedTime(new Date(), timezone);
}

export function getCurrentDayTimezone(): Date
{
	return new Date(utcToZonedTime(new Date(), timezone).setHours(0, 0, 0, 0));
}

export function parse(date: any, readFormat: string | null = null): Date
{
	if (readFormat === null)
	{
		return toDate(date);
	}

	return dateFNSParse(date, readFormat, new Date());
}

export function getCurrentDate(): number
{
	return Date.now();
}

export function subtract(date: Date | number, amount: number, type: 'days' | 'minutes'): Date
{
	if (type === 'days')
	{
		return subDays(date, amount);
	}
	else if (type === 'minutes')
	{
		return subMinutes(date, amount);
	}

	throw new Error('type must be days or minutes');
}

export function subtractFromCurrentDate(amount: number, type: 'days' | 'minutes'): Date
{
	return subtract(getCurrentDate(), amount, type);
}

export function subtractFromCurrentDateTimezone(amount: number, type: 'days' | 'minutes'): Date
{
	return subtract(getCurrentDateTimezone(), amount, type);
}

export function add(date: Date | number, amount: number, type: 'days' | 'months'): Date
{
	if (type === 'days')
	{
		return addDays(date, amount);
	}
	else if (type === 'months')
	{
		return addMonths(date, amount);
	}

	throw new Error('type must be days or months');
}

export function addToCurrentDateTimezone(amount: number, type: 'days' | 'months'): Date
{
	return add(getCurrentDateTimezone(), amount, type);
}

export function isValid(date: number | Date | string, readFormat: string | null = null): boolean
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

export function isBetween(date: number | Date | string, start: number | Date | string, end: number | Date | string, type: 'month'): boolean
{
	if (type === 'month')
	{
		return isSame(date, start, 'month') || isSame(date, end, 'month') || isAfter(date, start) && isBefore(date, end);
	}

	return false;
}

export function startOfDay(date: Date | number): Date
{
	return dateFNSStartOfDay(date);
}

export function diff(date1: Date | number, date2: Date, type: 'day' | null = null): number
{
	if (type === 'day' || typeof date1 === 'number')
	{
		return differenceInDays(date1, date2);
	}

	return date1.getTime() - date2.getTime();
}

export function isSame(date1: number | Date | string, date2: number | Date | string, type: 'month' | 'day' | 'year' | null = null): boolean
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

export function currentDateIsSame(date: number | Date | string, type: 'month' | 'day' | 'year' | null = null): boolean
{
	return isSame(date, getCurrentDayTimezone(), type);
}

export function isSameCurrentDateTimezone(date: number | Date | string, type: 'month' | 'day' | 'year' | null = null): boolean
{
	return isSame(dateToTimezone(date), getCurrentDateTimezone(), type);
}

export function isSameTimezone2(date1: number | Date | string, date2: number | Date | string, type: 'month' | 'day' | 'year' | null = null)
{
	return isSame(dateToTimezone(date1), dateToTimezone(date2), type);
}

export function isBefore(date1: number | Date | string, date2: number | Date | string): boolean
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

export function currentDateIsBefore(date: number | Date | string): boolean
{
	return isBefore(getCurrentDayTimezone(), date);
}

export function isBeforeCurrentDateTimezone(date: number | Date | string): boolean
{
	return isBefore(dateToTimezone(date), getCurrentDateTimezone());
}

export function isBeforeTimezone2(date1: number | Date | string, date2: number | Date | string): boolean
{
	return isBefore(dateToTimezone(date1), dateToTimezone(date2));
}

export function isAfter(date1: number | Date | string, date2: number | Date | string): boolean
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

export function isAfterTimezone(date1: number | Date | string, date2: number | Date | string): boolean
{
	return isAfter(dateToTimezone(date1), date2);
}

export function currentDateIsAfter(date: number | Date | string): boolean
{
	return isAfter(getCurrentDayTimezone(), date);
}

export function isAfterCurrentDateTimezone(date: number | Date | string): boolean
{
	return isAfter(dateToTimezone(date), getCurrentDateTimezone());
}

export function isAfterTimezone2(date1: number | Date | string, date2: number | Date | string): boolean
{
	return isAfter(dateToTimezone(date1), dateToTimezone(date2));
}

export function toDate(date: number | Date | string): Date
{
	return new Date(date);
}

export function dateParse(date: string | Date): number
{
	// yes, Date.parse(new Date()) works
	return (Date as any).parse(date);
}

export function dateToDate(year: number, monthIndex: number, day: number): Date
{
	return new Date(year, monthIndex, day);
}

export function getUTCFullYear(date: number | Date | string): number
{
	return toDate(date).getUTCFullYear();
}

export function toUTC(year: number, monthIndex: number, day: number, hours: number): number
{
	return Date.UTC(year, monthIndex, day, hours);
}

export function getAge(birthDate: Date): number
{
	return Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

export function isNewMember(signupDate: number | Date | string): boolean
{
	let date = subtractFromCurrentDateTimezone(constants.scoutHub.newMemberEligibility, 'days');

	if (date === null)
	{
		return false;
	}

	return isAfter(dateToTimezone(signupDate), date);
}

export function shouldHaveNewMemberRestrictions(signupDate: number | Date | string): boolean
{
	let date = subtractFromCurrentDateTimezone(5, 'days');

	if (date === null)
	{
		return false;
	}

	return isAfter(dateToTimezone(signupDate), date);
}
