import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import {
	APIThisType,
	CalendarType,
	ACGameYearsType,
	EventsType,
	ResidentsType,
	CreaturesType,
	CreatureType,
} from '@types';

/*
 * Get monthly calendar information.
 */
async function calendar(this: APIThisType, { requester, gameId, month, year, debug }: calendarProps): Promise<CalendarType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-calendar' });

	if (!permissionGranted)
	{
		return {
			game: {},
			months: [],
		} as unknown as CalendarType;
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

	let currentDate: number = dateUtils.getCurrentDate();

	if (requester === 'homepage' && !constants.LIVE_SITE && utils.realStringLength(debug) > 0)
	{
		if (!dateUtils.isValid(debug))
		{
			throw new UserError('bad-format');
		}

		currentDate = dateUtils.toDate(debug).getTime();
		month = dateUtils.formatMonth(debug, dateUtils.utcTimezone);
		year = dateUtils.formatYear(debug, dateUtils.utcTimezone);
	}

	// get data

	let categoryIdentifiers = [
		constants.calendarCategories.creatures,
		constants.calendarCategories.birthdays,
		constants.calendarCategories.events,
	];

	let hemisphere: string | null = null;

	// if no game, use settings to get current game if possible. 
	if (!gameId || requester === 'homepage')
	{
		let setting: { id: number, game_id: number, game_name: string, hemisphere_name: string | null } | undefined;

		if (this.userId)
		{
			let args = [this.userId];

			if (gameId)
			{
				args.push(gameId);
			}

			// verify that settings exist for this game ID, otherwise just get newest
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
				${gameId ? ' AND calendar_setting.game_id = $2::int' : ''}
				ORDER BY calendar_setting.game_id ASC
				${gameId ? '' : ' LIMIT 1'}
			`, ...args);

			if (setting)
			{
				gameId = setting.game_id;
			}
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
				`, setting.id)).map((uc: { identifier: string }) => uc.identifier);

				if (setting.hemisphere_name)
				{
					hemisphere = setting.hemisphere_name.toLowerCase();
				}
			}
			else
			{
				// if not set, just grab events
				categoryIdentifiers = [
					constants.calendarCategories.events,
				];

				hemisphere = 'north';
			}
		}
	}

	const acGameYears: ACGameYearsType = await ACCCache.get(constants.cacheKeys.years);

	if (!acGameYears[gameId])
	{
		throw new UserError('bad-format');
	}

	if (!acGameYears[gameId].includes(year))
	{
		throw new UserError('bad-format');
	}

	const [[acGame], calendarCategories]: [[{ game_name: string }], { identifier: string, name: string }[]] = await Promise.all([
		db.cacheQuery(constants.cacheKeys.acGame, `
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

	const gameDir: string = acGame.game_name.toLowerCase().replace('ac:', '');

	const creaturesName: string = calendarCategories.find(c => c.identifier === constants.calendarCategories.creatures)!.name;
	const eventsName: string = calendarCategories.find(c => c.identifier === constants.calendarCategories.events)!.name;
	const birthdaysName: string = calendarCategories.find(c => c.identifier === constants.calendarCategories.birthdays)!.name;
	const yesterdayDate = dateUtils.subtractNumber(currentDate, 1, 'days');

	const allMonths: boolean = month === 0 && requester === 'calendar';

	const events: EventsType = await ACCCache.get(constants.cacheKeys.events);
	const residents: ResidentsType = await ACCCache.get(constants.cacheKeys.residents);
	const creatures: CreaturesType = await ACCCache.get(constants.cacheKeys.creatures);

	let months;

	if (allMonths)
	{
		months = constants.months.map(month =>
		{
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
					yesterdayDate,
					events,
					residents,
					creatures,
				),
			};
		});
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
				yesterdayDate,
				events,
				residents,
				creatures,
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

function getCategoriesForMonth(month: number, year: number, requester: string, gameId: number, currentDate: number, hemisphere: string | null, categoryIdentifiers: string[], gameDir: string, creaturesName: string, eventsName: string, birthdaysName: string, yesterdayDate: Date, events: EventsType, residents: ResidentsType, creatures: CreaturesType): CalendarType['months'][number]['categories']
{
	let categories: {
		name: string
		identifier: string
		events: CalendarType['months'][number]['categories'][number]['events']
	}[] = [];
	const currentMonth = dateUtils.parse(`${month}/${year}`, 'M/yyyy');

	// get all events for month (Calendar) OR from yesterday to +30 days (Homepage)
	if (categoryIdentifiers.includes(constants.calendarCategories.events))
	{
		let eventsList: CalendarType['months'][number]['categories'][number]['events'] = requester === 'homepage' ?
			calculateEventsHomepage(gameId, hemisphere, currentDate, events) : [];

		if (requester === 'calendar')
		{
			events[gameId].map(event =>
			{
				let name = event.displayName === 'Fireworks Show' && event.name ? `${event.name}` : `${event.displayName}`;

				if (Object.prototype.hasOwnProperty.call(event, 'type'))
				{
					name += ` (${event.type})`;
				}

				if (gameId === constants.gameIds.ACNH)
				{
					['north', 'south'].map(hem =>
					{
						const dates = getStartEndDatesForYear(gameId, event, year, hem);

						if (dates !== null &&
							(dateUtils.isSame(dates.startDate, currentMonth, 'month') ||
							dates.endDate !== null && (dateUtils.isBetween(currentMonth, dates.startDate, dates.endDate, 'month') || dateUtils.isSame(dates.endDate, currentMonth, 'month')))
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
						dates.endDate !== null && (dateUtils.isBetween(currentMonth, dates.startDate, dates.endDate, 'month') || dateUtils.isSame(dates.endDate, currentMonth, 'month')))
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
		let birthdayEvents: CalendarType['months'][number]['categories'][number]['events'] = [];

		residents[gameId].map((resident) =>
		{
			const birthday = dateUtils.startOfDay(dateUtils.parse(`${resident.birthday}/${year}`, 'MM/dd/yyyy'));

			const birthdayDiff = dateUtils.diff(currentDate, birthday, 'day');

			const img = utils.villagerIconUrl(resident.name, gameId);

			if (requester === 'homepage' && (dateUtils.isSame(birthday, yesterdayDate, 'day') || birthdayDiff > -30 && birthdayDiff <= 0) ||
				requester === 'calendar' && dateUtils.isSame(birthday, currentMonth, 'month')
			)
			{
				birthdayEvents.push({
					name: resident.name,
					timing: dateUtils.formatDate2(birthday),
					sortDate: birthday,
					img: img,
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
		let creatureEvents: CalendarType['months'][number]['categories'][number]['events'] = [];

		creatures[gameId].map((creature: CreatureType) =>
		{
			const name = `${creature.name} (${creature.type})`;
			const img = constants.allImages[
				`icons/creatures/${gameDir}/${creature.imgName}.png`
			];

			if (Object.prototype.hasOwnProperty.call(creature, 'hemispheres') && creature.hemispheres)
			{
				let knownHemispheres: string[] = [];
				let timing = '';

				Object.keys(creature.hemispheres).map(hem =>
				{
					if (creature.hemispheres)
					{
						const hemInfo = creature.hemispheres[hem];

						if (hemInfo.monthsArray.includes(month) && (hemisphere === null || hemisphere === hem))
						{
							knownHemispheres.push(hem);
							timing = hemInfo.time.join(',');
						}
					}
				});

				if (knownHemispheres.length > 0)
				{
					const displayHem = knownHemispheres.length === 1 ? `${utils.capitalize(String(knownHemispheres.pop() || ''))}, ` : '';

					creatureEvents.push({
						name: name,
						timing: `${displayHem}${timing}${creature.timing}`,
						img: img,
					});
				}
			}
			else
			{
				if (Object.prototype.hasOwnProperty.call(creature, 'monthsArray'))
				{
					if (Array.isArray(creature.monthsArray) && creature.monthsArray.includes(month))
					{
						creatureEvents.push({
							name: name,
							timing: creature.time + creature.timing,
							img: img,
						});
					}
				}
				else if (Object.prototype.hasOwnProperty.call(creature, 'monthsTimesArray') && Array.isArray(creature.monthsTimesArray))
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
	categories.find(c => c.name === eventsName)?.events.sort((a, b) => dateUtils.diff(a.sortDate as Date, b.sortDate as Date));

	// sort birthdays by their birthdate
	categories.find(c => c.name === birthdaysName)?.events.sort((a, b) => dateUtils.diff(a.sortDate as Date, b.sortDate as Date));

	return categories;
}

/*
 * Takes events and figures out which are between yesterday and +30 days.
 */
function calculateEventsHomepage(gameId: number, hemisphere: string | null, currentDate: number, events: EventsType): CalendarType['months'][number]['categories'][number]['events']
{
	let resultEvents: CalendarType['months'][number]['categories'][number]['events'] = [];
	const currentYear = dateUtils.formatYear(currentDate, dateUtils.utcTimezone);
	const yesterdayDate = dateUtils.subtractNumber(currentDate, 1, 'days');
	const yesterday = dateUtils.formatYear(yesterdayDate, dateUtils.utcTimezone);
	const thirtyDays = dateUtils.formatYear(dateUtils.addNumber(currentDate, 30, 'days'), dateUtils.utcTimezone);

	events[gameId].map(event =>
	{
		let startDate: NonNullable<StartEndDatesYearReturnType>['startDate'] | null = null;
		let endDate: NonNullable<StartEndDatesYearReturnType>['endDate'] = null;
		let thirtyDates: StartEndDatesYearReturnType = null;
		let currentDates: StartEndDatesYearReturnType = null;
		let yesterdayDates: StartEndDatesYearReturnType = null;

		// get dates for year '+30 days' and check if event was in next 30 days
		thirtyDates = currentDates = getStartEndDatesForYear(gameId, event, currentYear, hemisphere);

		if (thirtyDates !== null)
		{
			let thirtyStartDate = thirtyDates.startDate;
			let thirtyEndDate = thirtyDates.endDate;
			let thirtyUseDate = thirtyEndDate === null ? thirtyStartDate : thirtyEndDate;
			let thirtyDiff = dateUtils.diff(currentDate, thirtyUseDate, 'day');

			if (thirtyDiff > -30 && thirtyDiff <= 0)
			{
				startDate = thirtyStartDate;
				endDate = thirtyEndDate;
			}
			// check if event is the beginning of next year (December)
			else if (currentYear !== thirtyDays)
			{
				thirtyDates = getStartEndDatesForYear(gameId, event, thirtyDays, hemisphere);

				if (thirtyDates !== null)
				{
					thirtyStartDate = thirtyDates.startDate;
					thirtyEndDate = thirtyDates.endDate;
					thirtyUseDate = thirtyEndDate === null ? thirtyStartDate : thirtyEndDate;
					thirtyDiff = dateUtils.diff(currentDate, thirtyUseDate, 'day');

					if (thirtyDiff > -30 && thirtyDiff < 0)
					{
						startDate = thirtyStartDate;
						endDate = thirtyEndDate;
					}
				}
			}
		}

		// if event wasn't '+30 days'
		if (startDate === null)
		{
			// get dates for year 'yesterday' and check if event is yesterday
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

			if (Object.prototype.hasOwnProperty.call(event, 'type'))
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
function getStartEndDatesForYear(gameId: number, event: EventsType[number][number], year: string | number, hemisphere?: string | null): StartEndDatesYearReturnType
{
	if (gameId === constants.gameIds.ACNH)
	{
		let dates = '';

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
		if (event.dateVariesByYear === 'Yes')
		{
			if (!Object.prototype.hasOwnProperty.call(event, year))
			{
				return null;
			}

			return datesToObject(gameId, event[year], year);
		}
		else
		{
			const startDate = dateUtils.parse(event.startDate + ` ${year}`, 'MMM d yyyy');
			const endDate = Object.prototype.hasOwnProperty.call(event, 'endDate') ? dateUtils.parse(event.endDate + ` ${year}`, 'MMM d yyyy') : null;

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
function datesToObject(gameId: number, dates: string, year: number | string): { startDate: Date, endDate: Date | null }
{
	let dash = ' - ';

	if (gameId === constants.gameIds.ACNH)
	{
		dash = ' – ';
	}

	if (dates.includes(dash))
	{
		const start = dateUtils.startOfDay(dateUtils.parse(dates.substring(0, dates.indexOf(dash)) + ` ${year}`, 'MMM d yyyy'));

		let endDate = dates.substring(dates.indexOf(dash) + dash.length);

		if (endDate === 'Feb 29')
		{
			endDate = 'Feb 28';
		}

		const end = dateUtils.startOfDay(dateUtils.parse(endDate + ` ${year}`, 'MMM d yyyy'));

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
function calculateEventTiming(event: EventsType[number][number], startDate: Date, endDate: Date | null, hemisphere: string | null = null): string
{
	let timing = hemisphere !== null ? `${hemisphere}, ` : '';

	if (Object.prototype.hasOwnProperty.call(event, 'region'))
	{
		timing += `${event.region}, `;
	}

	timing += `${dateUtils.formatDate2(startDate)}`;

	if (endDate !== null)
	{
		timing += ` - ${dateUtils.formatDate2(endDate)}`;
	}

	if (Object.prototype.hasOwnProperty.call(event, 'startTime') && event.startTime !== event.endTime)
	{
		timing += `, ${event.startTime} - ${event.endTime}`;
	}

	if (Object.prototype.hasOwnProperty.call(event, 'notes'))
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
		default: () => dateUtils.getCurrentMonth(),
	},
	year: {
		type: APITypes.number,
		default: () => dateUtils.getCurrentYear(),
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
};

type calendarProps = {
	requester: 'homepage' | 'calendar'
	gameId: number
	month: number
	year: number
	debug: string
};

type StartEndDatesYearReturnType = { startDate: Date, endDate: Date | null } | null;

export default calendar;
