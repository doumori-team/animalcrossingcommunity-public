import React, { useState } from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { constants } from '@utils';
import { Form, Select } from '@form';
import { Header, Search, Section } from '@layout';

const CalendarPage = () =>
{
	const {acgames, months, game, initialYears} = useLoaderData();

	const [selectedGameId, setSelectedGameId] = useState(game.id);
	const [years, setYears] = useState(initialYears[game.id]);

	const allMonths = {
		id: 0,
		name: 'All Months',
		year: months.length > 1 ? months[0].year : '',
	};

	const monthValue = months.length > 1 ? allMonths : months[0];

	const changeGame = (event) =>
	{
		const gameId = Number(event.target.value);

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
							options={[allMonths].concat(constants.months)}
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

				{months.map(month =>
					<Section key={month.id}>
						<div className='CalendarPage_monthSection'>
							<div className='CalendarPage_monthName'>
								{month.name} {month.year}
							</div>

							<div className='CalendarPage_categorySections'>
								{month.categories.map((category, index) =>
									category.events.length > 0 && (
										<div className='CalendarPage_categorySection' key={index}>
											<div className='CalendarPage_categoryName'>
												{category.name}
											</div>

											<div className='CalendarPage_eventSections'>
												{category.events.map((event, index) =>
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

export async function loadData(_, {gameId, month, year})
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

export default CalendarPage;
