import { constants } from '@utils';

import acgcCreatures from './acgc/creatures.json' assert { type: "json"};
import acwwCreatures from './acww/creatures.json' assert { type: "json"};
import accfCreatures from './accf/creatures.json' assert { type: "json"};
import acnlCreatures from './acnl/creatures.json' assert { type: "json"};
import acnhCreatures from '../acnh-sheet/creatures.json' assert { type: "json"};

// Grabs the data from the files and sorts it in a way that's easier for the front-end
export const creatures = {
	[constants.gameIds.ACGC]: getCreatureInfo(constants.gameIds.ACGC, acgcCreatures),
	[constants.gameIds.ACWW]: getCreatureInfo(constants.gameIds.ACWW, acwwCreatures),
	[constants.gameIds.ACCF]: getCreatureInfo(constants.gameIds.ACCF, accfCreatures),
	[constants.gameIds.ACNL]: getCreatureInfo(constants.gameIds.ACNL, acnlCreatures),
	[constants.gameIds.ACNH]: getCreatureInfo(constants.gameIds.ACNH, acnhCreatures)
};

/*
 * For each game, gets the creature info.
 */
function getCreatureInfo(id, creatures)
{
	let results = [];

	for (let key in creatures)
	{
		const creature = creatures[key];

		const name = creature.name;
		const how = creature.whereHow;
		const weather = creature.weather;
		const shadow = creature.shadow;
		const catchDifficulty = creature.catchDifficulty;
		const type = creature.sourceSheet;

		let resultCreature = {};

		if (id === constants.gameIds.ACNH)
		{
			resultCreature = {
				name: name,
				how: how,
				weather: weather,
				hemispheres: creature.hemispheres,
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

			if (creature.hasOwnProperty('monthsArray'))
			{
				resultCreature.monthsArray = creature.monthsArray;
			}
			else if (creature.hasOwnProperty('monthsTimesArray'))
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
function calculateCreatureTiming(creature)
{
	let timing = '';

	if (creature.how != undefined)
	{
		timing += `, ${creature.how}`;
	}

	if (creature.weather != undefined)
	{
		timing += `, ${creature.weather}`;
	}

	if (creature.shadow != undefined)
	{
		timing += `, ${creature.shadow}`;
	}

	if (creature.catchDifficulty != undefined)
	{
		timing += `, ${creature.catchDifficulty}`;
	}

	return timing;
}