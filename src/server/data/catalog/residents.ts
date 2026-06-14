/* eslint-disable @typescript-eslint/no-explicit-any */
import { constants, dateUtils } from '@utils';
import { ResidentsType } from '@types';
import acgcVillagers from './acgc/villagers.json';
import acwwVillagers from './acww/villagers.json';
import accfVillagers from './accf/villagers.json';
import acnlVillagers from './acnl/villagers.json';
import acnhVillagers from '../acnh-sheet/villagers.json';

// Grabs the data from the files and sorts it in a way that's easier for the front-end

export const residents = {
	[constants.gameIds.ACGC]: getResidents(constants.gameIds.ACGC, acgcVillagers),
	[constants.gameIds.ACWW]: getResidents(constants.gameIds.ACWW, acwwVillagers),
	[constants.gameIds.ACCF]: getResidents(constants.gameIds.ACCF, accfVillagers),
	[constants.gameIds.ACNL]: getResidents(constants.gameIds.ACNL, acnlVillagers),
	[constants.gameIds.ACNH]: getResidents(constants.gameIds.ACNH, acnhVillagers),
};

/*
 * For each game, gets the resident info.
 */
function getResidents(id: number, villagers: {
	uniqueEntryId: string
	name: string
	is_town?: boolean
	is_island?: boolean
	birthday?: string
}[]): ResidentsType[number]
{
	const residents: ResidentsType[number] = [];

	for (let key in villagers)
	{
		const villager = (villagers as any)[key];

		let birthday: string | null = null;

		if (Object.prototype.hasOwnProperty.call(villager, 'birthday'))
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

		const isTown = Object.prototype.hasOwnProperty.call(villager, 'is_town') ? villager.is_town : true;
		const isIsland = Object.prototype.hasOwnProperty.call(villager, 'is_island') ? villager.is_island : false;

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
