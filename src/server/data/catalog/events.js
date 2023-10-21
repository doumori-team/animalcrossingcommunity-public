import { constants, dateUtils } from '@utils';

import acgcEvents from './acgc/seasonAndEvents.json' assert { type: "json"};
import acwwEvents from './acww/seasonAndEvents.json' assert { type: "json"};
import accfEvents from './accf/seasonAndEvents.json' assert { type: "json"};
import acnlEvents from './acnl/seasonAndEvents.json' assert { type: "json"};
import acnhEvents from '../acnh-sheet/seasonAndEvents.json' assert { type: "json"};

// remove any events that aren't needed:
// - Player's birthday
// - A season (ex. Summer)
// - New Year's Day subsection (ex. Year of the Tiger)
// - Wedding Season subsection
// - Toy Day subsections
// - Festival subsection
// - Halloween subsection
// - Turkey Day subsection
const acnhEventsFiltered = acnhEvents.filter(event => {
	return (!['Birthday'].includes(event.name)) &&
		(!['Calendar season'].includes(event.type)) &&
		((event.displayName === "New Year's Day" && event.name === event.displayName) || event.displayName !== "New Year's Day") &&
		((event.displayName === "Wedding Season" && event.name === event.displayName) || event.displayName !== "Wedding Season") &&
		((event.displayName === "Toy Day" && event.name === event.displayName) || event.displayName !== "Toy Day") &&
		((event.displayName === "Festivale" && event.name === event.displayName) || event.displayName !== "Festivale") &&
		((event.displayName === "Halloween" && event.name === event.displayName) || event.displayName !== "Halloween") &&
		((event.displayName === "Turkey Day" && event.name === event.displayName) || event.displayName !== "Turkey Day");
})

// Grabs the data from the files and sorts it in a way that's easier for the front-end

export const events = {
	[constants.gameIds.ACGC]: acgcEvents,
	[constants.gameIds.ACWW]: acwwEvents,
	[constants.gameIds.ACCF]: accfEvents,
	[constants.gameIds.ACNL]: acnlEvents,
	[constants.gameIds.ACNH]: acnhEventsFiltered
};

export const years = {
	[constants.gameIds.ACGC]: getEventYears(acgcEvents),
	[constants.gameIds.ACWW]: getEventYears(acwwEvents),
	[constants.gameIds.ACCF]: getEventYears(accfEvents),
	[constants.gameIds.ACNL]: getEventYears(acnlEvents),
	[constants.gameIds.ACNH]: getEventYears(acnhEventsFiltered)
}

/*
 * For each game, gets the years that game supports.
 */
function getEventYears(events)
{
	let acGameYears = [];

	events.map(event => {
		// get years that that event supports
		Object.keys(event).map(key => {
			const potentialYear = key.substring(0, 4);

			if (!isNaN(potentialYear))
			{
				if (dateUtils.isValid(potentialYear, 'year') && !acGameYears.includes(Number(dateUtils.format(potentialYear, 'yyyy', 'yyyy'))))
				{
					acGameYears.push(Number(dateUtils.format(potentialYear, 'yyyy', 'yyyy')));
				}
			}
		});
	});

	// sort years in order
	acGameYears.sort((a, b) => a - b);

	return acGameYears;
}