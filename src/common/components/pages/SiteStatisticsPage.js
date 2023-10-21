import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Text } from '@form';
import { Header, Search, Section, ContentBox } from '@layout';
import { dateUtils } from '@utils';

const SiteStatisticsPage = () =>
{
	const {stats, date} = useLoaderData();

	return (
		<div className='SiteStatisticsPage'>
			<RequireUser>
				<Header
					name='Site Statistics'
				/>

				<Search callback='/site-statistics'>
					<Form.Group>
						<Text
							type='date'
							name='date'
							label='Date'
							value={date}
							min='2002-10-28'
							max={dateUtils.formatYesterdayYearMonthDay()}
							required
						/>
					</Form.Group>
				</Search>

				<ContentBox>
					{stats.map((stat, index) =>
						<div className='SiteStatisticsPage_stat' key={index}>
							{stat.label}: {stat.number}
						</div>
					)}
				</ContentBox>
			</RequireUser>
		</div>
	);
}

export async function loadData(_, {date})
{
	const [returnValue] = await Promise.all([
		this.query('v1/analytics/stats', {
			date: date ? date : '',
		}),
	]);

	return {
		stats: returnValue.results,
		date: returnValue.date,
	};
}

export default SiteStatisticsPage;