import React, { useState } from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { constants } from '@utils';
import { Form, Select } from '@form';
import { Header, Search, Section } from '@layout';
import { APIThisType, CalendarType, ACGameYearsType, ACGameType, ElementSelectType } from '@types';

const CalendarPage = () =>
{
	const {acgames, months, game, initialYears} = useLoaderData() as CalendarPageProps;

	const [selectedGameId, setSelectedGameId] = useState<CalendarType['game']>(game.id);
	const [years, setYears] = useState<number[]>(initialYears[game.id]);

	const monthValue = months.length > 1 ? {
		id: 0,
		name: 'All Months',
		year: months.length > 1 ? months[0].year : '',
	} : months[0];

	const changeGame = (e: ElementSelectType) : void =>
	{
		const gameId = Number(e.target.value);

		setSelectedGameId(gameId);
		setYears(initialYears[game.id]);
	}

	return (
		<RequirePermission permission='view-calendar'>
			<div className='CalendarPage'>
				<Header
					name='Monthly Calendar'
				/>

				<Search callback='/calendar'>
					<Form.Group>
						<Select
							label='Game'
							name='gameId'
							value={selectedGameId}
							options={acgames.filter(g => g.hasTown === true)}
							optionsMapping={{value: 'id', label: 'name'}}
							changeHandler={changeGame}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Month'
							name='month'
							value={monthValue.id}
							options={[{
								id: 0,
								name: 'All Months'
							}].concat(constants.months)}
							optionsMapping={{value: 'id', label: 'name'}}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Year'
							name='year'
							value={monthValue.year}
							options={years
								.map(year => ({value: year, label: year}))
							}
						/>
					</Form.Group>
				</Search>

				{months.map((month:CalendarType['months']) =>
					<Section key={month.id}>
						<div className='CalendarPage_monthSection'>
							<div className='CalendarPage_monthName'>
								{month.name} {month.year}
							</div>

							<div className='CalendarPage_categorySections'>
								{month.categories.map((category:CalendarType['months']['categories'], index:number) =>
									category.events.length > 0 && (
										<div className='CalendarPage_categorySection' key={index}>
											<div className='CalendarPage_categoryName'>
												{category.name}
											</div>

											<div className='CalendarPage_eventSections'>
												{category.events.map((event:CalendarType['months']['categories']['events'], index:number) =>
													<div className='CalendarPage_eventSection' key={index}>
														{event.hasOwnProperty('img') && (
															<div className='CalendarPage_eventImg'>
																<img
																	alt={event.name}
																	src={event.img}
																/>
															</div>
														)}

														<div className='CalendarPage_eventText'>
															<div className='CalendarPage_eventName'>
																{event.name}
															</div>

															<div className='CalendarPage_timing'>
																{event.timing}
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									)
								)}
							</div>
						</div>
					</Section>
				)}
			</div>
		</RequirePermission>
	);
}

export async function loadData(this: APIThisType, _: any, {gameId, month, year}: {gameId?: string, month?: string, year?: string}) : Promise<CalendarPageProps>
{
	const [returnValue, acgames, years] = await Promise.all([
		this.query('v1/acgame/calendar', {
			requester: 'calendar',
			gameId: gameId ? gameId : '',
			month: month ? month : '',
			year: year ? year : '',
		}),
		this.query('v1/acgames'),
		this.query('v1/acgame/years'),
	]);

	return {
		game: returnValue.game,
		acgames: acgames,
		months: returnValue.months,
		initialYears: years,
	};
}

type CalendarPageProps = {
	game: CalendarType['game']
	acgames: ACGameType[]
	months: CalendarType['months']
	initialYears: ACGameYearsType
}

export default CalendarPage;
