import { constants, dateUtils } from '@utils';

import acgcVillagers from './acgc/villagers.json' assert { type: 'json'};
import acwwVillagers from './acww/villagers.json' assert { type: 'json'};
import accfVillagers from './accf/villagers.json' assert { type: 'json'};
import acnlVillagers from './acnl/villagers.json' assert { type: 'json'};
import acnhVillagers from '../acnh-sheet/villagers.json' assert { type: 'json'};

// Grabs the data from the files and sorts it in a way that's easier for the front-end

export const residents = {
	[constants.gameIds.ACGC]: getResidents(constants.gameIds.ACGC, acgcVillagers),
	[constants.gameIds.ACWW]: getResidents(constants.gameIds.ACWW, acwwVillagers),
	[constants.gameIds.ACCF]: getResidents(constants.gameIds.ACCF, accfVillagers),
	[constants.gameIds.ACNL]: getResidents(constants.gameIds.ACNL, acnlVillagers),
	[constants.gameIds.ACNH]: getResidents(constants.gameIds.ACNH, acnhVillagers),
}

/*
 * For each game, gets the resident info.
 */
function getResidents(id, villagers)
{
	const residents = [];

	for (let key in villagers)
	{
		const villager = villagers[key];

		let birthday = null;

		if (villager.hasOwnProperty('birthday'))
		{
			if (id === constants.gameIds.ACNH)
			{
				birthday = dateUtils.format(villager.birthday, 'MM/dd', 'M/d');
			}
			else
			{
				birthday = dateUtils.format(villager.birthday, 'MM/dd', 'MMMM d');
			}
		}

		const isTown = villager.hasOwnProperty('is_town') ? villager.is_town : true;
		const isIsland = villager.hasOwnProperty('is_island') ? villager.is_island : false;

		residents.push({
			id: villager.uniqueEntryId,
			name: villager.name,
			isTown: isTown,
			isIsland: isIsland,
			gameId: id,
			birthday: birthday,
		});
	}

	return residents.sort((a, b) => a.name.localeCompare(b.name));
}

