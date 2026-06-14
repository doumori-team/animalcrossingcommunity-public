/* eslint-disable @typescript-eslint/no-explicit-any */
import { constants } from '@utils';
import { CreaturesType } from '@types';
import acgcCreatures from './acgc/creatures.json';
import acwwCreatures from './acww/creatures.json';
import accfCreatures from './accf/creatures.json';
import acnlCreatures from './acnl/creatures.json';
import acnhInsects from '../acnh-sheet/insects.json';
import acnhFish from '../acnh-sheet/fish.json';
import acnhSeaCreatures from '../acnh-sheet/seaCreatures.json';

const acnhCreatures =
		(acnhInsects as any)
		.concat(acnhFish)
		.concat(acnhSeaCreatures);

const MONTHS = [
	{ key: 'Jan', num: 1, label: 'Jan' },
	{ key: 'Feb', num: 2, label: 'Feb' },
	{ key: 'Mar', num: 3, label: 'Mar' },
	{ key: 'Apr', num: 4, label: 'Apr' },
	{ key: 'May', num: 5, label: 'May' },
	{ key: 'Jun', num: 6, label: 'Jun' },
	{ key: 'Jul', num: 7, label: 'Jul' },
	{ key: 'Aug', num: 8, label: 'Aug' },
	{ key: 'Sep', num: 9, label: 'Sep' },
	{ key: 'Oct', num: 10, label: 'Oct' },
	{ key: 'Nov', num: 11, label: 'Nov' },
	{ key: 'Dec', num: 12, label: 'Dec' },
] as const;

// Grabs the data from the files and sorts it in a way that's easier for the front-end
export const creatures = {
	[constants.gameIds.ACGC]: getCreatureInfo(constants.gameIds.ACGC, acgcCreatures),
	[constants.gameIds.ACWW]: getCreatureInfo(constants.gameIds.ACWW, acwwCreatures),
	[constants.gameIds.ACCF]: getCreatureInfo(constants.gameIds.ACCF, accfCreatures),
	[constants.gameIds.ACNL]: getCreatureInfo(constants.gameIds.ACNL, acnlCreatures),
	[constants.gameIds.ACNH]: getCreatureInfo(constants.gameIds.ACNH, acnhCreatures),
};

type MonthlyTime = string | null;

type FileCreatureType = {
	name: string
	whereHow?: string
	weather?: string
	shadow?: string
	catchDifficulty?: string
	sourceSheet: string
	// AC:NH only
	// North Hemisphere
	nhJan?: MonthlyTime;
	nhFeb?: MonthlyTime;
	nhMar?: MonthlyTime;
	nhApr?: MonthlyTime;
	nhMay?: MonthlyTime;
	nhJun?: MonthlyTime;
	nhJul?: MonthlyTime;
	nhAug?: MonthlyTime;
	nhSep?: MonthlyTime;
	nhOct?: MonthlyTime;
	nhNov?: MonthlyTime;
	nhDec?: MonthlyTime;

	// South Hemisphere
	shJan?: MonthlyTime;
	shFeb?: MonthlyTime;
	shMar?: MonthlyTime;
	shApr?: MonthlyTime;
	shMay?: MonthlyTime;
	shJun?: MonthlyTime;
	shJul?: MonthlyTime;
	shAug?: MonthlyTime;
	shSep?: MonthlyTime;
	shOct?: MonthlyTime;
	shNov?: MonthlyTime;
	shDec?: MonthlyTime;
	// non-AC:NH only
	time?: string
	monthsArray?: number[]
	monthsTimesArray?: {
		monthsArray: number[]
		time: string
	}[]
};

type HemisphereTiming = {
	time: string[]
	timeArray: number[]
	months: string[]
	monthsArray: number[]
};

type Hemispheres = {
	north: HemisphereTiming | null
	south: HemisphereTiming | null
};

/*
 * For each game, gets the creature info.
 */
function getCreatureInfo(id: number, creatures: FileCreatureType[]): CreaturesType[string]
{
	let results: CreaturesType[string] = [];

	for (let key in creatures)
	{
		const creature = creatures[key];

		const name = creature.name;
		const how = creature.whereHow;
		const weather = creature.weather;
		const shadow = creature.shadow;
		const catchDifficulty = creature.catchDifficulty;
		const type = creature.sourceSheet;

		let resultCreature: any = {};

		if (id === constants.gameIds.ACNH)
		{
			resultCreature = {
				name: name,
				how: how,
				weather: weather,
				hemispheres: toHemispheres(creature),
				shadow: shadow,
				catchDifficulty: catchDifficulty,
				type: type,
			};
		}
		else
		{
			resultCreature = {
				name: name,
				time: creature.time,
				how: how,
				weather: weather,
				shadow: shadow,
				catchDifficulty: catchDifficulty,
				type: type,
			};

			if (Object.prototype.hasOwnProperty.call(creature, 'monthsArray'))
			{
				resultCreature.monthsArray = creature.monthsArray;
			}
			else if (Object.prototype.hasOwnProperty.call(creature, 'monthsTimesArray'))
			{
				resultCreature.monthsTimesArray = creature.monthsTimesArray;
			}
		}

		resultCreature.timing = calculateCreatureTiming(resultCreature);
		resultCreature.imgName = creature.name
			.replace(/\s+/g, '_')
			.replace('-', '')
			.replace("'", '')
			.replace('(', '')
			.replace(')', '')
			.toLowerCase();

		results.push(resultCreature);
	}

	return results;
}

/*
 * Figure out user-facing timing for creature.
 */
function calculateCreatureTiming(creature: CreaturesType[string][number]): string
{
	let timing = '';

	if (creature.how)
	{
		timing += `, ${creature.how}`;
	}

	if (creature.weather)
	{
		timing += `, ${creature.weather}`;
	}

	if (creature.shadow)
	{
		timing += `, ${creature.shadow}`;
	}

	if (creature.catchDifficulty)
	{
		timing += `, ${creature.catchDifficulty}`;
	}

	return timing;
}

function parseTimeToArray(timeStr: string): number[]
{
	if (timeStr === 'All day')
	{
		return Array.from({ length: 24 }, (_, i) => i);
	}

	const [startRaw, endRaw] = timeStr.split('–').map(s => s.trim());

	const toHour = (s: string) =>
	{
		const [hRaw, apRaw] = s.split(/\s+/);
		let h = parseInt(hRaw, 10);
		const ap = apRaw?.toUpperCase();

		if (ap === 'PM' && h !== 12)
		{
			h += 12;
		}

		if (ap === 'AM' && h === 12)
		{
			h = 0;
		}

		return h;
	};

	const start = toHour(startRaw);
	const end = toHour(endRaw);

	const hours: number[] = [];
	let h = start;

	while (h !== end)
	{
		hours.push(h);
		h = (h + 1) % 24;
	}

	return hours;
}

function monthsToRanges(monthNums: number[]): string[]
{
	if (monthNums.length === 0)
	{
		return [];
	}

	const ranges: Array<[number, number]> = [];

	let start = monthNums[0];
	let prev = start;

	for (let i = 1; i < monthNums.length; i++)
	{
		const curr = monthNums[i];

		if (curr === prev + 1)
		{
			prev = curr;
		}
		else
		{
			ranges.push([start, prev]);
			start = curr;
			prev = curr;
		}
	}

	ranges.push([start, prev]);

	return ranges.map(([a, b]) =>
	{
		if (a === b)
		{
			return MONTHS[a - 1].label;
		}

		return `${MONTHS[a - 1].label} - ${MONTHS[b - 1].label}`;
	});
}

function buildHemisphereFromMonthly(
	creature: FileCreatureType,
	prefix: 'nh' | 'sh',
): HemisphereTiming | null
{
	const monthNums = MONTHS
		.filter(m =>
		{
			const key = `${prefix}${m.key}` as keyof FileCreatureType;

			return creature[key] !== null;
		})
		.map(m => m.num);

	if (monthNums.length === 0)
	{
		return null;
	}

	const firstMonthWithTime = MONTHS.find(m =>
	{
		const key = `${prefix}${m.key}` as keyof FileCreatureType;

		return creature[key] !== null;
	})!;

	const timeStr = creature[`${prefix}${firstMonthWithTime.key}` as keyof FileCreatureType] as string;

	return {
		time: [timeStr],
		timeArray: parseTimeToArray(timeStr),
		months: monthsToRanges(monthNums),
		monthsArray: monthNums,
	};
}

/**
 * Pass in a creature that has nh/sh fields and get the old hemispheres object back.
 */
function toHemispheres(creature: FileCreatureType): Hemispheres
{
	return {
		north: buildHemisphereFromMonthly(creature, 'nh'),
		south: buildHemisphereFromMonthly(creature, 'sh'),
	};
}
