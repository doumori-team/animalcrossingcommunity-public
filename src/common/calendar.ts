import { utils, constants, dateUtils } from '@utils';
import { SeasonsType } from '@types';

// This file is to keep track of changes to the site that are scheduled to occur at specific dates
// e.g. seasonal colour changes, event-exclusive banners, etc.

/* SEASONAL COLOURS */

// These are lists of "breakpoints", i.e., specific times during the year and colours assigned to each of those times.
// The colours fade smoothly and gradually between each pair of adjacent breakpoints.

// Colours for the background grass. The first colour is the background itself and the other three are the colours of the triangles.
// These were eyedropped from the grass textures in AC:NL (for spring and summer) and WW (for autumn and winter),
// and then the saturation was increased by 20% across the board.
const grassData = [
	{ point: 0.0000, colors: [{ h:145,s:100,l: 31 },{ h: 94,s: 59,l: 51 },{ h:130,s: 62,l: 46 },{ h: 72,s: 58,l: 46 }] },
	{ point: 0.2504, colors: [{ h:151,s:100,l: 29 },{ h:107,s: 62,l: 44 },{ h:145,s:100,l: 36 },{ h:159,s: 99,l: 35 }] },
	{ point: 0.5467, colors: [{ h:161,s:100,l: 26 },{ h:124,s: 29,l: 49 },{ h:135,s: 64,l: 42 },{ h:169,s:100,l: 32 }] },
	{ point: 0.6844, colors: [{ h:100,s: 63,l: 33 },{ h: 90,s: 70,l: 44 },{ h: 99,s: 78,l: 38 },{ h: 80,s: 65,l: 36 }] },
	{ point: 0.7589, colors: [{ h: 53,s: 59,l: 36 },{ h: 56,s: 88,l: 39 },{ h: 46,s: 83,l: 42 },{ h: 71,s: 74,l: 41 }] },
	{ point: 0.8489, colors: [{ h: 37,s: 68,l: 42 },{ h: 51,s: 91,l: 44 },{ h: 43,s: 80,l: 47 },{ h: 33,s: 67,l: 50 }] },
	{ point: 0.9101, colors: [{ h: 33,s: 64,l: 39 },{ h: 41,s: 90,l: 42 },{ h: 37,s: 84,l: 44 },{ h: 26,s: 68,l: 46 }] },
	{ point: 0.9560, colors: [{ h: 15,s: 53,l: 38 },{ h: 36,s: 76,l: 42 },{ h: 30,s: 70,l: 44 },{ h:-15,s: 36,l: 49 }] },
	{ point: 1.0000, colors: [{ h:  0,s: 29,l: 35 },{ h: 20,s: 30,l: 52 },{ h:  0,s: 20,l: 44 },{ h: 12,s: 36,l: 49 }] },
];
// The "-15 degrees" hue on one of the colours above is a bit of a hack to make sure it's within 180 degrees of the neighbouring hues,
// so that we don't have to do any modular arithmetic. It means the same thing as 345 degrees (i.e. reddish-purple).

// Colours for UI components, accessible through CSS. In order, these are "default", "light" and "dark".
// These were eyedropped from the AC:NL tree textures, and then the saturation was reduced by 20% across the board.
const treeData = [
	{ point:-0.1384, colors: [{ h:115,s: 24,l: 40 },{ h:120,s:  7,l: 51 },{ h:120,s:  7,l: 81 },{ h:110,s: 10,l: 33 }] },
	{ point: 0.1419, colors: [{ h: 92,s: 64,l: 40 },{ h: 90,s: 52,l: 49 },{ h: 90,s: 52,l: 79 },{ h:107,s: 71,l: 34 }] },
	{ point: 0.1696, colors: [{ h:117,s: 67,l: 39 },{ h: 97,s: 40,l: 52 },{ h: 97,s: 40,l: 82 },{ h:129,s: 80,l: 26 }] },
	{ point: 0.4533, colors: [{ h:137,s: 63,l: 41 },{ h:129,s: 49,l: 49 },{ h:129,s: 49,l: 79 },{ h:157,s: 80,l: 26 }] },
	{ point: 0.5156, colors: [{ h:142,s: 80,l: 26 },{ h:158,s: 61,l: 32 },{ h:158,s: 61,l: 62 },{ h:156,s: 69,l: 18 }] },
	{ point: 0.6747, colors: [{ h:139,s: 61,l: 38 },{ h: 95,s: 43,l: 51 },{ h: 95,s: 43,l: 81 },{ h:117,s: 73,l: 29 }] },
	{ point: 0.7024, colors: [{ h: 73,s: 48,l: 43 },{ h: 60,s: 40,l: 51 },{ h: 60,s: 40,l: 81 },{ h: 93,s: 80,l: 26 }] },
	{ point: 0.8096, colors: [{ h: 55,s: 80,l: 41 },{ h: 53,s: 80,l: 44 },{ h: 53,s: 80,l: 74 },{ h: 54,s: 72,l: 37 }] },
	{ point: 0.8374, colors: [{ h: 50,s: 75,l: 42 },{ h: 60,s: 80,l: 43 },{ h: 60,s: 80,l: 73 },{ h: 44,s: 80,l: 36 }] },
	{ point: 0.8651, colors: [{ h: 30,s: 78,l: 47 },{ h: 55,s: 80,l: 43 },{ h: 55,s: 80,l: 73 },{ h: 27,s: 57,l: 42 }] },
	{ point: 0.8927, colors: [{ h: 37,s: 72,l: 50 },{ h: 37,s: 70,l: 52 },{ h: 37,s: 70,l: 82 },{ h: 16,s: 67,l: 41 }] },
	{ point: 0.9204, colors: [{ h: 23,s: 67,l: 48 },{ h: 25,s: 67,l: 54 },{ h: 25,s: 67,l: 84 },{ h: 14,s: 80,l: 35 }] },
	{ point: 0.9481, colors: [{ h:  2,s: 78,l: 41 },{ h:  5,s: 69,l: 45 },{ h:  5,s: 69,l: 75 },{ h: 10,s: 80,l: 25 }] },
	{ point: 0.9654, colors: [{ h: 23,s: 70,l: 32 },{ h: 19,s: 46,l: 47 },{ h: 19,s: 46,l: 77 },{ h: 17,s: 68,l: 26 }] },
	{ point: 0.9827, colors: [{ h: 24,s: 63,l: 39 },{ h: 28,s: 59,l: 61 },{ h: 28,s: 59,l: 91 },{ h: 25,s: 80,l: 25 }] },
	{ point: 1.0000, colors: [{ h: 25,s: 68,l: 31 },{ h: 24,s: 52,l: 34 },{ h: 24,s: 52,l: 64 },{ h: 26,s: 78,l: 24 }] },
];

export function getSeason(dateOverride: string | null = null, southernHemisphere: boolean = false): SeasonsType
{
	let time = dateUtils.getCurrentDate();
	let debug = false;

	// dateOverride can be specified by testers on test sites
	// to see what the colours look like on a different date
	if (dateOverride && !constants.LIVE_SITE)
	{
		const parsedDate = dateUtils.dateParse(dateOverride);

		if (!isNaN(parsedDate))
		{
			time = parsedDate + 5 * 60 * 60 * 1000; // ACC timezone
			debug = true;
		}
	}

	const year = dateUtils.getUTCFullYear(time);

	// we add 6 months to figure out when grass is growing in the relevant NH spot for SH
	const yearProgressTime = southernHemisphere ? dateUtils.dateParse(dateUtils.add(time, 6, 'months')) : time;
	const yearProgressYear = dateUtils.getUTCFullYear(yearProgressTime);

	// Grass colours are defined between these two dates
	// Northern Hemisphere: February 25th 05:00 UTC - December 11th 05:00 UTC
	// Southern Hemisphere: August 25th 05:00 UTC - June 11th 05:00 UTC
	const grassStartTime = dateUtils.toUTC(yearProgressYear, 1, 25, 5);
	const grassEndTime = dateUtils.toUTC(yearProgressYear, 11, 11, 5);

	const yearProgress = (yearProgressTime - grassStartTime) / (grassEndTime - grassStartTime);

	let grassColors, uiColors, theme = 'default';

	if (yearProgress < 0 || yearProgress >= 1)
	{
		// Snowy theme
		grassColors = ['#b0c8d8', '#f0f0f0', '#e0e8e8', '#dae2e5'];
		uiColors = ['#e0e8e8', '#f0f0f0', '#dae2e5', '#b0c8d8'];
		theme = 'snow';
	}
	else
	{
		grassColors = getColors(grassData, yearProgress);
		uiColors = getColors(treeData, yearProgress);
	}

	// June - August
	let season = 'summer', event = null, headerColor = 'rgba(0,190,0,.2)';

	// March-April 1 (EDT), April 10 - May
	if (time >= dateUtils.toUTC(year, 2, 1, 5) && time < dateUtils.toUTC(year, 3, 1, 4) ||
		time >= dateUtils.toUTC(year, 3, 10, 4) && time < dateUtils.toUTC(year, 5, 1, 4)
	)
	{
		season = southernHemisphere ? 'autumn' : 'spring';

		if (southernHemisphere)
		{
			headerColor = 'rgba(200,0,0,.2)';
		}
	}
	// April 1 - 10
	else if (time >= dateUtils.toUTC(year, 3, 1, 4) && time < dateUtils.toUTC(year, 3, 10, 4))
	{
		season = southernHemisphere ? 'autumn' : 'cherry';

		if (southernHemisphere)
		{
			headerColor = 'rgba(200,0,0,.2)';
		}
		else
		{
			theme = 'cherry';
			//headerColor = 'rgba(255,255,255,0)';
			//uiColors = ['#fd8acc', '#ffacff', '#ffccfc', '#c54194'];
		}

		// April Fool's Day
		if (time >= dateUtils.toUTC(year, 3, 1, 4) && time < dateUtils.toUTC(year, 3, 2, 4))
		{
			event = 'aprilfools';
		}
	}
	// June - August (EDT)
	else if (time >= dateUtils.toUTC(year, 5, 1, 4) && time < dateUtils.toUTC(year, 8, 1, 4))
	{
		season = southernHemisphere ? 'winter' : 'summer';

		if (southernHemisphere)
		{
			headerColor = 'rgba(230, 230, 255, .2)';
		}

		// August Fireworks (Sundays in August)
		if (time >= dateUtils.toUTC(year, 7, 1, 4) && time < dateUtils.toUTC(year, 8, 1, 4) && dateUtils.dateToTimezone(time).getDay() === 0)
		{
			event = 'fireworks';
		}
	}
	// September-October 1 (EDT), October 10 - November
	else if (time >= dateUtils.toUTC(year, 8, 1, 4) && time < dateUtils.toUTC(year, 9, 1, 4) ||
		time >= dateUtils.toUTC(year, 9, 10, 4) && time < dateUtils.toUTC(year, 11, 1, 5)
	)
	{
		season = southernHemisphere ? 'spring' : 'autumn';

		if (!southernHemisphere)
		{
			headerColor = 'rgba(200,0,0,.2)';
		}

		// October 28th, ACC's Birthday
		if (time >= dateUtils.toUTC(year, 9, 28, 4) && time < dateUtils.toUTC(year, 9, 29, 4))
		{
			event = 'anniversary';
		}
		// October 29 - October 30
		else if (time >= dateUtils.toUTC(year, 9, 29, 4) && time < dateUtils.toUTC(year, 10, 1, 4))
		{
			event = 'halloween';
		}
		// November 22 - November 29
		else if (time >= dateUtils.toUTC(year, 10, 22, 5) && time < dateUtils.toUTC(year, 10, 29, 5))
		{
			event = 'thanksgiving';
		}
	}
	// October 1 - 10
	else if (time >= dateUtils.toUTC(year, 9, 1, 4) && time < dateUtils.toUTC(year, 9, 10, 4))
	{
		season = southernHemisphere ? 'cherry' : 'autumn';

		if (!southernHemisphere)
		{
			headerColor = 'rgba(200,0,0,.2)';
		}
		else
		{
			theme = 'cherry';
			//headerColor = 'rgba(255,255,255,0)';
			//uiColors = ['#fd8acc', '#ffacff', '#ffccfc', '#c54194'];
		}
	}
	// December, January-February
	else if (time >= dateUtils.toUTC(year, 11, 1, 5) ||
		time >= dateUtils.toUTC(year, 0, 1, 0) && time < dateUtils.toUTC(year, 2, 1, 5)
	)
	{
		season = southernHemisphere ? 'summer' : 'winter';

		if (!southernHemisphere)
		{
			headerColor = 'rgba(230, 230, 255, .2)';
		}

		// December 17 - 24
		if (time >= dateUtils.toUTC(year, 11, 17, 5) && time < dateUtils.toUTC(year, 11, 24, 5))
		{
			event = 'festive';
		}
		// December 24-26
		else if (time >= dateUtils.toUTC(year, 11, 24, 5) && time < dateUtils.toUTC(year, 11, 27, 5))
		{
			event = 'jingle';
		}
		// December 30, Before midnight EST
		else if (time >= dateUtils.toUTC(year, 11, 30, 5) || time < dateUtils.toUTC(year, 0, 1, 5))
		{
			event = 'newyear';
		}
		// January 1
		else if (time <= dateUtils.toUTC(year, 0, 2, 5))
		{
			event = 'newyearday';
		}
		// February 2
		else if (time >= dateUtils.toUTC(year, 1, 2, 5) && time < dateUtils.toUTC(year, 1, 3, 5))
		{
			event = 'groundhog';
		}
		// February 15 - 22
		else if (time >= dateUtils.toUTC(year, 1, 15, 5) && time < dateUtils.toUTC(year, 1, 22, 5))
		{
			event = 'presidentsday';
		}
	}

	const bannerName = utils.realStringLength(event) > 0 && event !== 'aprilfools' ? event : season;

	return {
		bg_colors: grassColors,
		ui_colors: {
			default: uiColors[0],
			light: uiColors[1],
			lighter: uiColors[2],
			dark: uiColors[3],
			header: headerColor,
		},
		theme,
		season,
		event,
		bannerName: String(bannerName || ''),
		debug,
		time,
	};
}

function getColors(breakpoints: any, yearProgress: any): string[]
{
	// Find which pair of breakpoints we are between
	let breakpoint1, breakpoint2;
	for (let i = 1; i < breakpoints.length; i++)
	{
		if (yearProgress >= breakpoints[i - 1].point && yearProgress < breakpoints[i].point)
		{
			breakpoint1 = breakpoints[i - 1];
			breakpoint2 = breakpoints[i];
			break;
		}
	}

	// This is the distance we are along the space between the two breakpoints
	// e.g. if factor = 0.25, we are 25% of the way from breakpoint1 to breakpoint2
	const factor = (yearProgress - breakpoint1.point) / (breakpoint2.point - breakpoint1.point);

	const resultColors = [];

	for (let i = 0; i < breakpoint1.colors.length; i++)
	{
		const color1 = breakpoint1.colors[i];
		const color2 = breakpoint2.colors[i];

		let h = color1.h + (color2.h - color1.h) * factor;
		const s = color1.s + (color2.s - color1.s) * factor;
		const l = color1.l + (color2.l - color1.l) * factor;

		// Because hue is a circle, not a scale, this calc for H gives an incorrect result
		// if the fading would ever wrap around from low H to high H.
		// We are avoiding this by using "-15 degrees" instead of "345 degrees" for the purple hue in late autumn,
		// but this sometimes produces a negative hue value. So let's check for that:

		if (h < 0)
		{
			h += 360;
		}

		// We could have done that with modular arithmetic instead but I can't be arsed.

		// Clamp everything to two decimal places so that the browser renderer doesn't have to keep recalculating stuff.
		resultColors.push(`hsl(${h.toFixed(2)},${s.toFixed(2)}%,${l.toFixed(2)}%)`);
	}

	return resultColors;
}
