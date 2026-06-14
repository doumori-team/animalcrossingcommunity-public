// This file is for date functions throughout the site.

import { format as dateFNSFormat, toZonedTime } from 'date-fns-tz';
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
	differenceInYears,
} from 'date-fns';

import * as constants from './constants.ts';

/**
 * Hey you, the person trying to debug this file.
 * Don't do `console.log(date)` with a zoned date. Date object always shows in UTC.
 * Use date-utils.test.ts to debug.
 * If timestamp with timezone from database, Node will make them Date object with db.query.
 * The goal for these functions is not to have much specific to Date or date-fns-tz outside of date-utils.
 * If we ever change out how we do dates and / or timezones (possible), this will help.
 */

const timezone = 'America/New_York';
export const utcTimezone = 'UTC';

const isServer = typeof window === 'undefined';

const nodeEnv = isServer
	? process.env.VITE_NODE_ENV
	: import.meta.env.VITE_NODE_ENV;

interface ZonedDate extends Date
{
	timeZone: string;
}

/**
 * We don't want to use toZonedTime twice.
 */
function ensureNotZoned(date: Date | number | string): void
{
	if (date instanceof Date)
	{
		// @ts-ignore
		if (date.timeZone)
		{
			if (nodeEnv !== 'production')
			{
				console.trace(`[Timezone Error] Date is already zoned.`);
				throw new Error(`[Timezone Error] Date is already zoned`);
			}
			else
			{
				console.warn(`[Timezone Error] Date is already zoned`);
			}
		}
	}
}

/**
 * Expect the date given to already be zoned.
 */
function ensureZoned(date: Date | number | string): void
{
	if (date instanceof Date)
	{
		if (!('timeZone' in date))
		{
			if (nodeEnv !== 'production')
			{
				console.trace(`[Timezone Error] Date is not zoned.`);
				throw new Error(`[Timezone Error] Date is not zoned`);
			}
			else
			{
				console.warn(`[Timezone Error] Date is not zoned`);
			}
		}
	}
}

/**
 * Both dates must be in the same zone for comparison.
 */
function ensureSameZone(date1: Date | number | string, date2: Date | number | string): void
{
	if (date1 instanceof Date && date2 instanceof Date)
	{
		// @ts-ignore
		const date1Zoned = date1.timeZone;
		// @ts-ignore
		const date2Zoned = date2.timeZone;

		if (date1Zoned !== date2Zoned)
		{
			if (nodeEnv !== 'production')
			{
				console.trace(`[Timezone Error] Date zoning mismatch: one is zoned, the other is not.`);
				console.error('date1:', date1);
				console.error('date2:', date2);
				throw new Error(`[Timezone Error] Date zoning mismatch: one is zoned, the other is not.`);
			}
			else
			{
				console.warn(`[Timezone Error] Date zoning mismatch: one is zoned, the other is not.`);
			}
		}
	}
}

/**
 * Some functions specifically made not to handle timezones (dates only);
 */
function ensureDateWithoutTime(date: Date | number | string): void
{
	if (typeof date === 'string')
	{
		const d = toDate(date);
		const utcMidnightMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

		if (d.getTime() !== utcMidnightMs)
		{
			if (nodeEnv !== 'production')
			{
				console.trace(`[Timezone Error] Date contains time.`);
				console.error('date:', date);
				throw new Error(`[Timezone Error] Date contains time.`);
			}
			else
			{
				console.warn(`[Timezone Error] Date contains time.`);
			}
		}
	}
}

/**
 * While other functions are specific for datetimes.
 */
function ensureDateWithTime(date: Date | number | string): void
{
	if (typeof date === 'string')
	{
		const d = toDate(date);
		const utcMidnightMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

		if (d.getTime() === utcMidnightMs)
		{
			if (nodeEnv !== 'production')
			{
				console.trace(`[Timezone Error] Date does not contain time.`);
				console.error('date:', date);
				throw new Error(`[Timezone Error] Date does not contain time.`);
			}
			else
			{
				console.warn(`[Timezone Error] Date does not contain time.`);
			}
		}
	}
}

/**
 * Primarily used for things like signupDate or birthdate, where the time is not a thing.
 */
export function formatDate(date: Date | string): string
{
	ensureDateWithoutTime(date);
	return dateFNSFormat(dateToTimezone(date, utcTimezone), 'MMMM do, y');
}

/**
 * Used for calendar, villager birthdays or event start / end dates.
 */
export function formatDate2(date: Date): string
{
	ensureNotZoned(date);
	ensureDateWithoutTime(date);
	return dateFNSFormat(date, 'EEE, MMM d');
}

/**
 * Used for bell shop calculation, expired item date.
 */
export function formatDate3(date: Date): string
{
	ensureZoned(date);
	ensureDateWithoutTime(date);
	return dateFNSFormat(date, 'MMMM do, y');
}

/**
 * Used for newsletter's issue date.
 */
export function formatDate4(date: Date): string
{
	ensureDateWithoutTime(date);
	return dateFNSFormat(dateToTimezone(date, utcTimezone), 'MMMM yyyy');
}

/**
 * Used for formatting birthdays on profiles for users that don't want to show their age.
 */
export function formatDateWithoutYear(date: Date): string
{
	ensureDateWithoutTime(date);
	return dateFNSFormat(dateToTimezone(date, utcTimezone), 'MMMM do');
}

export function formatDateTime(date: Date | string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y h:mm a');
}

export function formatDateTime2(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM h:mmaaa');
}

export function formatDateTime3(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'EEEE do MMMM y h:mmaaa');
}

/**
 * Used for ACC's Clock.
 */
export function formatDateTime4(date: Date): string
{
	ensureZoned(date);
	ensureDateWithTime(date);
	return dateFNSFormat(date, 'M/d (EEE), h:mm a');
}

export function formatDateTime5(date: Date | string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, y');
}

export function formatDateTime6(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'MMMM do, h:mm a');
}

export function formatYearMonthDay(date: Date): string
{
	ensureDateWithoutTime(date);
	return dateFNSFormat(toDate(date), 'yyyy-MM-dd');
}

export function formatYearMonthDay2(date: string): string
{
	return dateFNSFormat(dateToTimezone(date), 'yyyy-MM-dd');
}

export function formatYearMonthDay3(date: Date): string
{
	ensureZoned(date);
	ensureDateWithoutTime(date);
	return dateFNSFormat(date, 'yyyy-MM-dd');
}

export function formatCurrentDateYearMonthDay(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'yyyy-MM-dd');
}

export function formatYesterdayYearMonthDay(): string
{
	return dateFNSFormat(subtractFromCurrentDateTimezone(1, 'days'), 'yyyy-MM-dd');
}

export function formatYear(date: Date | number | string, useTimezone = timezone): number
{
	return Number(dateFNSFormat(dateToTimezone(date, useTimezone), 'y'));
}

export function formatMonth(date: string, useTimezone = timezone): number
{
	return Number(dateFNSFormat(dateToTimezone(date, useTimezone), 'M'));
}

export function formatHoursMinutes(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'h:mm a');
}

export function formatMonthDayHoursMinutes(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'M/dd h:mm a');
}

export function formatMonthDayYearHoursMinutes(date: string): string
{
	ensureDateWithTime(date);
	return dateFNSFormat(dateToTimezone(date), 'M/dd/yyyy h:mm a');
}

export function getCurrentYear(): number
{
	return Number(dateFNSFormat(getCurrentDateTimezone(), 'y'));
}

export function getCurrentMonthDay(): string
{
	return dateFNSFormat(getCurrentDateTimezone(), 'MMdd');
}

export function getCurrentMonth(): number
{
	return Number(dateFNSFormat(getCurrentDateTimezone(), 'M'));
}

export function format(date: Date | string, format: string, readFormat: string | null = null): string
{
	ensureNotZoned(date);
	return dateFNSFormat(typeof date === 'string' ? parse(date, readFormat) : date, format);
}

function toZonedDateTagged(date: Date | number | string, useTimezone = timezone): ZonedDate
{
	// gives you a new Date whose clock reads what the time would be in that zone - but still represents the same instant.
	const zoned = toZonedTime(date, useTimezone) as ZonedDate;
	zoned.timeZone = useTimezone;
	return zoned;
}

function toDateTagged(date: Date): ZonedDate
{
	const zoned = date as ZonedDate;
	zoned.timeZone = timezone;
	return zoned;
}

export function dateToTimezone(date: Date | number | string, useTimezone = timezone): ZonedDate
{
	ensureNotZoned(date);
	return toZonedDateTagged(toDate(date), useTimezone);
}

export function getCurrentDateTimezone(useTimezone = timezone): ZonedDate
{
	return toZonedDateTagged(new Date(), useTimezone);
}

function getCurrentDayTimezone(): ZonedDate
{
	return dateToTimezone(parse(dateFNSFormat(getCurrentDateTimezone(), 'yyyy-MM-dd'), 'yyyy-MM-dd'));
}

export function parse(date: number | string, readFormat: string | null = null): Date
{
	if (readFormat === null)
	{
		return toDate(date);
	}

	return dateFNSParse(typeof date === 'number' ? String(date) : date, readFormat, new Date());
}

/**
 * Date.now always returns UTC date.
 */
export function getCurrentDate(): number
{
	return Date.now();
}

/**
 * Apparently proper way to subtract when using dates as a number.
 * Otherwise it'll be slightly off (milliseconds) in different timezones.
 */
export function subtractNumber(date: number, amount: number, type: 'days'): Date
{
	const useDate = dateToTimezone(date, timezone);

	if (type === 'days')
	{
		return subDays(useDate, amount);
	}

	throw new Error('type must be days or minutes');
}

function subtractDate(date: Date, amount: number, type: 'days' | 'minutes'): Date
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

export function subtractFromCurrentDateTimezone(amount: number, type: 'days' | 'minutes'): ZonedDate
{
	return toDateTagged(subtractDate(getCurrentDateTimezone(), amount, type));
}

export function subtractDateTimezone(date: Date, amount: number, type: 'minutes'): ZonedDate
{
	return toDateTagged(subtractDate(dateToTimezone(date), amount, type));
}

/**
 * Apparently proper way to add when using dates as a number.
 * Otherwise it'll be slightly off (milliseconds) in different timezones.
 */
export function addNumber(date: number, amount: number, type: 'days' | 'months'): Date
{
	const useDate = dateToTimezone(date, timezone);

	if (type === 'days')
	{
		return addDays(useDate, amount);
	}
	else if (type === 'months')
	{
		// Do calendar arithmetic in UTC to avoid timezone-dependent overflow
		const d = new Date(date);
		const year = d.getUTCFullYear();
		const month = d.getUTCMonth();
		const day = d.getUTCDate();
		const hours = d.getUTCHours();
		const minutes = d.getUTCMinutes();
		const seconds = d.getUTCSeconds();
		const ms = d.getUTCMilliseconds();

		let newMonth = month + amount;
		let newYear = year + Math.floor(newMonth / 12);
		newMonth = (newMonth % 12 + 12) % 12;

		// Clamp day to last day of target month
		const maxDay = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
		const newDay = Math.min(day, maxDay);

		return new Date(Date.UTC(newYear, newMonth, newDay, hours, minutes, seconds, ms));
	}

	throw new Error('type must be days or months');
}

function addDate(date: Date, amount: number, type: 'days' | 'months'): Date
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

export function addToCurrentDateTimezone(amount: number, type: 'days' | 'months'): ZonedDate
{
	return toDateTagged(addDate(getCurrentDateTimezone(), amount, type));
}

export function isValid(date: number | string, type: 'month' | 'year' | null = null): boolean
{
	if (type === 'month')
	{
		return dateFNSIsValid(parse(date, 'M'));
	}
	else if (type === 'year')
	{
		return dateFNSIsValid(parse(date, 'yyyy'));
	}

	return dateFNSIsValid(new Date(date));
}

export function isBetween(date: Date, start: Date, end: Date, type: 'month'): boolean
{
	if (type === 'month')
	{
		return isSame(date, start, 'month') || isSame(date, end, 'month') || isAfter(date, start) && isBefore(date, end);
	}

	throw new Error('type must be month');
}

/**
 * Used for calendar, villager birthdays or event start / end dates.
 */
export function startOfDay(date: Date): Date
{
	ensureNotZoned(date);
	return dateFNSStartOfDay(date);
}

export function diff(date1: Date | number, date2: Date, type: 'day' | null = null): number
{
	ensureSameZone(date1, date2);

	if (type === 'day')
	{
		return differenceInDays(dateToTimezone(date1), date2);
	}

	if (typeof date1 === 'number')
	{
		throw new Error('Type needs to be day for number comparison.');
	}

	return date1.getTime() - date2.getTime();
}

export function isSame(date1: Date | string, date2: Date | string, type: 'month' | 'day' | 'year' | 'date' | null = null): boolean
{
	ensureSameZone(date1, date2);

	if (type === 'month')
	{
		// same month and year
		return isSameMonth(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
	}
	else if (type === 'day')
	{
		// same day, month and year
		return isSameDay(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
	}
	else if (type === 'year')
	{
		// same year
		return isSameYear(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
	}
	else if (type === 'date')
	{
		if (typeof date1 === 'string' || typeof date2 === 'string')
		{
			throw new Error('Type date does not support string dates (yet).');
		}

		return date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate();
	}

	// exactly the same time
	return isEqual(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
}

export function currentDateIsSame(date: string, readFormat: string): boolean
{
	return isSame(dateToTimezone(parse(date, readFormat)), getCurrentDayTimezone());
}

export function isSameCurrentDateTimezone(date: string, type: 'day' | 'year'): boolean
{
	return isSame(dateToTimezone(date), getCurrentDateTimezone(), type);
}

export function isSameTimezone2(date1: string, date2: string): boolean
{
	return isSame(dateToTimezone(date1), dateToTimezone(date2));
}

export function isSameCurrentDate(date: string, readFormat: string): boolean
{
	return isSame(dateToTimezone(parse(date, readFormat)), getCurrentDayTimezone(), 'date');
}

export function isBefore(date1: Date | string, date2: Date | string): boolean
{
	ensureSameZone(date1, date2);
	return dateFNSIsBefore(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
}

export function currentDateIsBefore(date: string, readFormat: string): boolean
{
	return isBefore(getCurrentDayTimezone(), dateToTimezone(parse(date, readFormat)));
}

export function isBeforeCurrentDateTimezone(date: string): boolean
{
	return isBefore(dateToTimezone(date), getCurrentDateTimezone());
}

export function isBeforeTimezone2(date1: string, date2: string): boolean
{
	return isBefore(dateToTimezone(date1), dateToTimezone(date2));
}

export function isAfter(date1: Date, date2: Date | string): boolean
{
	ensureSameZone(date1, date2);
	return dateFNSIsAfter(typeof date1 === 'string' ? parse(date1) : date1, typeof date2 === 'string' ? parse(date2) : date2);
}

export function isAfterTimezone(date1: Date | string, date2: Date): boolean
{
	return isAfter(dateToTimezone(date1), date2);
}

export function currentDateIsAfter(date: string, readFormat: string): boolean
{
	return isAfter(getCurrentDayTimezone(), dateToTimezone(parse(date, readFormat)));
}

export function isAfterCurrentDateTimezone(date: string): boolean
{
	return isAfter(dateToTimezone(date), getCurrentDateTimezone());
}

export function isAfterTimezone2(date1: string | Date, date2: string | Date): boolean
{
	return isAfter(dateToTimezone(date1), dateToTimezone(date2));
}

export function toDate(date: number | Date | string): Date
{
	ensureNotZoned(date);
	return new Date(date);
}

export function dateParse(date: string): number
{
	return Date.parse(date);
}

export function dateToDate(year: number, monthIndex: number, day: number): Date
{
	return new Date(Date.UTC(year, monthIndex, day));
}

export function getUTCFullYear(date: number): number
{
	return toDate(date).getUTCFullYear();
}

export function toUTC(year: number, monthIndex: number, day: number, hours: number): number
{
	return Date.UTC(year, monthIndex, day, hours);
}

export function getAge(birthDate: Date): number
{
	const currentDate = getCurrentDateTimezone(utcTimezone);
	const birthday = 'timeZone' in birthDate ? birthDate : dateToTimezone(birthDate, utcTimezone);
	ensureSameZone(currentDate, birthday);
	return differenceInYears(currentDate, birthday);
}

export function isNewMember(signupDate: string): boolean
{
	return isAfter(dateToTimezone(signupDate), subtractFromCurrentDateTimezone(constants.scoutHub.newMemberEligibility, 'days'));
}

export function shouldHaveNewMemberRestrictions(signupDate: string): boolean
{
	return isAfter(dateToTimezone(signupDate), subtractFromCurrentDateTimezone(5, 'days'));
}
