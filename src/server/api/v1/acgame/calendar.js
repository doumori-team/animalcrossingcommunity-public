import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import { residents } from '@/catalog/residents.js';
import { creatures } from '@/catalog/creatures.js';
import { events } from '@/catalog/events.js';
import { years as acGameYears } from '@/catalog/events.js';
import * as APITypes from '@apiTypes';

/*
 * Get monthly calendar information.
 */
async function calendar({requester, gameId, month, year, debug})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-calendar'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	if (month !== 0 && !dateUtils.isValid(month, 'month'))
	{
		throw new UserError('bad-format');
	}

	if (!dateUtils.isValid(year, 'year'))
	{
		throw new UserError('bad-format');
	}

	let user = null;

	if (this.userId)
	{
		user = await this.query('v1/user_lite', {id: this.userId});

		if (typeof(user) === 'undefined' || user.length === 0)
		{
			throw new UserError('no-such-user');
		}
	}

	let currentDate = dateUtils.getCurrentDate();

	if (requester === 'homepage' && !constants.LIVE_SITE && utils.realStringLength(debug) > 0)
	{
		if (!dateUtils.isValid(debug))
		{
			throw new UserError('bad-format');
		}

		currentDate = dateUtils.toDate(debug);
		month = Number(dateUtils.formatMonth(debug));
		year = Number(dateUtils.formatYear(debug));
	}

	// get data

	let categoryIdentifiers = [
		constants.calendarCategories.creatures,
		constants.calendarCategories.birthdays,
		constants.calendarCategories.events
	];

	let hemisphere = null;

	// if no game, or homepage, use settings to get current game if possible
	if (!gameId || requester === 'homepage')
	{
		let setting = null;

		if (user)
		{
			[setting] = await db.query(`
				SELECT
					calendar_setting.id,
					calendar_setting.game_id,
					ac_game.shortname AS game_name,
					hemisphere.name AS hemisphere_name
				FROM calendar_setting
				JOIN ac_game ON (ac_game.id = calendar_setting.game_id)
				LEFT JOIN hemisphere ON (hemisphere.id = calendar_setting.hemisphere_id)
				WHERE calendar_setting.user_id = $1::int AND calendar_setting.homepage = true
				ORDER BY calendar_setting.game_id ASC
				LIMIT 1
			`, user.id);

			gameId = setting?.game_id;
		}

		// default to latest game
		if (!gameId)
		{
			gameId = constants.gameIds.ACNH;
		}

		// get settings categories and hemisphere
		if (requester === 'homepage')
		{
			if (setting)
			{
				categoryIdentifiers = (await db.query(`
					SELECT
						calendar_category.identifier
					FROM calendar_setting_category
					JOIN calendar_category ON (calendar_category.id = calendar_setting_category.category_id)
					WHERE calendar_setting_category.calendar_setting_id = $1::int
				`, setting.id)).map(uc => uc.identifier);

				hemisphere = setting.hemisphere_name?.toLowerCase();
			}
			else
			{
				// if not set, just grab events
				categoryIdentifiers = [
					constants.calendarCategories.events
				];

				hemisphere = 'north';
			}
		}
	}

	if (!acGameYears[gameId].includes(year))
	{
		throw new UserError('bad-format');
	}

	const [[acGame], calendarCategories] = await Promise.all([
		db.query(`
			SELECT shortname AS game_name
			FROM ac_game
			WHERE id = $1::int
		`, gameId),
		db.query(`
			SELECT
				identifier,
				name
			FROM calendar_category
		`),
	]);

	const gameDir = acGame.game_name.toLowerCase().replace('ac:', '');

	const creaturesName = calendarCategories.find(c => c.identifier === constants.calendarCategories.creatures).name;
	const eventsName = calendarCategories.find(c => c.identifier === constants.calendarCategories.events).name;
	const birthdaysName = calendarCategories.find(c => c.identifier === constants.calendarCategories.birthdays).name;
	const yesterdayDate = dateUtils.subtractFromCurrentDate(1, 'days');

	const allMonths = month === 0 && requester === 'calendar';

	let months;

	if (allMonths)
	{
		months = constants.months.map(month => {
			const monthId = Number(month.id);

			return {
				id: monthId,
				name: month.name,
				year: year,
				categories: getCategoriesForMonth(
					monthId,
					year,
					requester,
					gameId,
					currentDate,
					hemisphere,
					categoryIdentifiers,
					gameDir,
					creaturesName,
					eventsName,
					birthdaysName,
					yesterdayDate
				),
			};
		})
	}
	else
	{
		months = [{
			id: month,
			name: dateUtils.format(dateUtils.parse(month, 'M'), 'MMMM'),
			year: year,
			categories: getCategoriesForMonth(
				month,
				year,
				requester,
				gameId,
				currentDate,
				hemisphere,
				categoryIdentifiers,
				gameDir,
				creaturesName,
				eventsName,
				birthdaysName,
				yesterdayDate
			),
		}];
	}

	return {
		game: {
			id: gameId,
			name: acGame.game_name,
		},
		months: months,
	};
}

function getCategoriesForMonth(month, year, requester, gameId, currentDate, hemisphere, categoryIdentifiers, gameDir, creaturesName, eventsName, birthdaysName, yesterdayDate)
{
	let categories = [];
	const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');

	// get all events for month (Calendar) OR from yesterday to +30 days (Homepage)
	if (categoryIdentifiers.includes(constants.calendarCategories.events))
	{
		let eventsList = requester === 'homepage' ?
			calculateEventsHomepage(gameId, hemisphere, currentDate) : [];

		if (requester === 'calendar')
		{
			events[gameId].map(event => {
				let name = `${event.displayName}`;

				if (event.hasOwnProperty('type'))
				{
					name += ` (${event.type})`;
				}

				if (gameId === constants.gameIds.ACNH)
				{
					['north', 'south'].map(hem => {
						const dates = getStartEndDatesForYear(gameId, event, year, hem);

						if (dates !== null &&
							(dateUtils.isSame(dates.startDate, currentMonth, 'month') ||
							(dates.endDate !== null && (dateUtils.isBetween(currentMonth, dates.startDate, dates.endDate, 'month') || dateUtils.isSame(dates.endDate, currentMonth, 'month'))))
						)
						{
							// if event is already in list, combine hemispheres
							// different then creatures; we want to combine Fishing
							// Tourney events for example but they're listed as different
							// events in the file
							let foundEvent = eventsList.find(e => e.name === name);

							if (foundEvent)
							{
								foundEvent.timing = foundEvent.timing.substring(7);
							}
							else
							{
								eventsList.push({
									name: name,
									timing: calculateEventTiming(event, dates.startDate, dates.endDate, hem),
									sortDate: dates.startDate,
								});
							}
						}
					});
				}
				else
				{
					const dates = getStartEndDatesForYear(gameId, event, year);

					if (dates !== null &&
						(dateUtils.isSame(dates.startDate, currentMonth, 'month') ||
						(dates.endDate !== null && (dateUtils.isBetween(currentMonth, dates.startDate, dates.endDate, 'month') || dateUtils.isSame(dates.endDate, currentMonth, 'month'))))
					)
					{
						eventsList.push({
							name: name,
							timing: calculateEventTiming(event, dates.startDate, dates.endDate),
							sortDate: dates.startDate,
						});
					}
				}
			});
		}

		categories.push({
			name: eventsName,
			identifier: constants.calendarCategories.events,
			events: eventsList,
		});
	}

	// get all birthdays for month (Calendar) OR from yesterday to +30 days (Homepage)
	if (categoryIdentifiers.includes(constants.calendarCategories.birthdays))
	{
		let birthdayEvents = [];

		residents[gameId].map(resident => {
			const birthday = dateUtils.startOfDay(dateUtils.parse(`${resident.birthday}/${year}`, 'MM/dd/yyyy'));

			const birthdayDiff = dateUtils.diff(currentDate, birthday, 'day');

			if ((requester === 'homepage' && (dateUtils.isSame(birthday, yesterdayDate, 'day') || (birthdayDiff > -30 && birthdayDiff < 0))) ||
				(requester === 'calendar' && dateUtils.isSame(birthday, currentMonth, 'month'))
			)
			{
				birthdayEvents.push({
					name: resident.name,
					timing: dateUtils.formatDate2(birthday),
					sortDate: birthday,
				});
			}
		});

		categories.push({
			name: birthdaysName,
			identifier: constants.calendarCategories.birthdays,
			events: birthdayEvents,
		});
	}

	// get all creatures for the month
	if (categoryIdentifiers.includes(constants.calendarCategories.creatures))
	{
		let creatureEvents = [];

		creatures[gameId].map(creature => {
			const name = `${creature.name} (${creature.type})`;
			const img = `${process.env.AWS_URL}/images/icons/creatures/${gameDir}/${creature.imgName}.png`;

			if (creature.hasOwnProperty('hemispheres'))
			{
				let knownHemispheres = [];
				let timing = '';

				Object.keys(creature.hemispheres).map(hem => {
					const hemInfo = creature.hemispheres[hem];

					if (hemInfo.monthsArray.includes(month) && (hemisphere === null || hemisphere === hem))
					{
						knownHemispheres.push(hem);
						timing = hemInfo.time;
					}
				});

				if (knownHemispheres.length > 0)
				{
					const displayHem = knownHemispheres.length === 1 ? `${utils.capitalize(knownHemispheres.pop())}, ` : '';

					creatureEvents.push({
						name: name,
						timing: `${displayHem}${timing}${creature.timing}`,
						img: img,
					});
				}
			}
			else
			{
				if (creature.hasOwnProperty('monthsArray'))
				{
					if (creature.monthsArray.includes(month))
					{
						creatureEvents.push({
							name: name,
							timing: creature.time + creature.timing,
							img: img,
						});
					}
				}
				else if (creature.hasOwnProperty('monthsTimesArray'))
				{
					for (let key in creature.monthsTimesArray)
					{
						const monthTime = creature.monthsTimesArray[key];

						if (monthTime.monthsArray.includes(month))
						{
							creatureEvents.push({
								name: name,
								timing: monthTime.time + creature.timing,
								img: img,
							});
						}
					}
				}
			}
		});

		categories.push({
			name: creaturesName,
			identifier: constants.calendarCategories.creatures,
			events: creatureEvents,
		});
	}

	// sort everything

	// sort creatures alphabetically
	categories.find(c => c.name === creaturesName)?.events.sort((a, b) => a.name.localeCompare(b.name));

	// sort events by their start date
	categories.find(c => c.name === eventsName)?.events.sort((a, b) => dateUtils.diff(a.sortDate, b.sortDate));

	// sort birthdays by their birthdate
	categories.find(c => c.name === birthdaysName)?.events.sort((a, b) => dateUtils.diff(a.sortDate, b.sortDate));

	return categories;
}

/*
 * Takes events and figures out which are between yesterday and +30 days.
 */
function calculateEventsHomepage(gameId, hemisphere, currentDate)
{
	let resultEvents = [];
	const currentYear = dateUtils.formatYear(currentDate);;
	const yesterdayDate = dateUtils.subtract(currentDate, 1, 'days');
	const yesterday = dateUtils.formatYear(yesterdayDate);
	const thirtyDays = dateUtils.formatYear(dateUtils.add(currentDate, 30, 'days'));

	events[gameId].map(event => {
		let startDate = null;
		let endDate = null;

		let thirtyDates = null;
		let currentDates = null;
		let yesterdayDates = null;

		// get dates for year '+30 days' and check if event was in next 30 days
		if (currentYear !== thirtyDays)
		{
			thirtyDates = getStartEndDatesForYear(gameId, event, thirtyDays, hemisphere);
		}
		else
		{
			thirtyDates = currentDates = getStartEndDatesForYear(gameId, event, currentYear, hemisphere);
		}

		if (thirtyDates !== null)
		{
			const thirtyStartDate = thirtyDates.startDate;
			const thirtyEndDate = thirtyDates.endDate;
			const thirtyUseDate = thirtyEndDate === null ? thirtyStartDate : thirtyEndDate;

			const thirtyDiff = dateUtils.diff(currentDate, thirtyUseDate, 'day');

			if (thirtyDiff > -30 && thirtyDiff < 0)
			{
				startDate = thirtyStartDate;
				endDate = thirtyEndDate;
			}
		}

		// if event wasn't '+30 days'
		if (startDate === null)
		{
			// get dates for year 'yesterday' and check if even is yesterday
			if (currentYear !== yesterday)
			{
				yesterdayDates = getStartEndDatesForYear(gameId, event, yesterday, hemisphere);
			}
			else
			{
				if (currentDates === null)
				{
					currentDates = getStartEndDatesForYear(gameId, event, currentYear, hemisphere);
				}

				yesterdayDates = currentDates;
			}

			if (yesterdayDates !== null)
			{
				const yesterdayStartDate = yesterdayDates.startDate;
				const yesterdayEndDate = yesterdayDates.endDate;
				const yesterdayUseDate = yesterdayEndDate === null ? yesterdayStartDate : yesterdayEndDate;

				if (dateUtils.isSame(yesterdayUseDate, yesterdayDate, 'day'))
				{
					startDate = yesterdayStartDate;
					endDate = yesterdayEndDate;
				}
			}
		}

		// if not null, then event is either yesterday or in next 30 days
		if (startDate !== null)
		{
			let name = event.displayName;

			if (event.hasOwnProperty('type'))
			{
				name += ` (${event.type})`;
			}

			resultEvents.push({
				name: name,
				timing: calculateEventTiming(event, startDate, endDate),
				sortDate: startDate,
			});
		}
	});

	return resultEvents;
}

/*
 * Figures out which dates to use from the event based on game, hemisphere and year.
 */
function getStartEndDatesForYear(gameId, event, year, hemisphere)
{
	if (gameId === constants.gameIds.ACNH)
	{
		let dates = {};

		if (hemisphere === 'north')
		{
			dates = event[`${year}Nh`];
		}
		else
		{
			dates = event[`${year}Sh`];
		}

		if (dates === null)
		{
			return null;
		}

		return datesToObject(gameId, dates, year);
	}
	else
	{
		if (event.dateVariesByYear)
		{
			if (!event.hasOwnProperty(year))
			{
				return null;
			}

			return datesToObject(gameId, event[year], year);
		}
		else
		{
			const startDate = dateUtils.parse(event.startDate + ` ${year}`, 'MMM d yyyy');
			const endDate = event.hasOwnProperty('endDate') ? dateUtils.parse(event.endDate + ` ${year}`, 'MMM d yyyy') : null;

			return {
				startDate: startDate,
				endDate: endDate,
			};
		}
	}
}

/*
 * Convert string to date.
 */
function datesToObject(gameId, dates, year)
{
	let dash = ' - ';

	if (gameId === constants.gameIds.ACNH)
	{
		dash = ' – ';
	}

	if (dates.includes(dash))
	{
		const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));
		const end = dateUtils.startOfDay(dateUtils.parse(dates.substring(dates.indexOf(dash)+dash.length) + ` ${year}`, 'MMM d yyyy'));

		return {
			startDate: start,
			endDate: end,
		};
	}
	else
	{
		const date = dateUtils.parse(dates + ` ${year}`, 'MMM d yyyy');

		return {
			startDate: date,
			endDate: null,
		};
	}
}

/*
 * Figure out user-facing timing for event.
 */
function calculateEventTiming(event, startDate, endDate, hemisphere = null)
{
	let timing = hemisphere !== null ? `${hemisphere}, ` : '';

	if (event.hasOwnProperty('region'))
	{
		timing += `${event.region}, `;
	}

	timing += `${dateUtils.formatDate2(startDate)}`;

	if (endDate !== null)
	{
		timing += ` - ${dateUtils.formatDate2(endDate)}`;
	}

	if (event.hasOwnProperty('startTime') && event.startTime !== event.endTime)
	{
		timing += `, ${event.startTime} - ${event.endTime}`;
	}

	if (event.hasOwnProperty('notes'))
	{
		timing += ` (${event.notes})`;
	}

	return timing;
}

calendar.apiTypes = {
	requester: {
		type: APITypes.string,
		default: '',
		includes: ['homepage', 'calendar'],
		required: true,
	},
	gameId: {
		type: APITypes.acgameId,
		nullable: true,
	},
	month: {
		type: APITypes.number,
		default: dateUtils.getCurrentMonth(),
	},
	year: {
		type: APITypes.number,
		default: dateUtils.getCurrentYear(),
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
}

export default calendar;