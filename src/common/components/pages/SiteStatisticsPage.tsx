import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

import { RequireUser } from '@behavior';
import { Form, Text } from '@form';
import { Header, Search, ContentBox, RequireLargeScreen } from '@layout';
import { dateUtils, utils, constants, routerUtils } from '@utils';
import { APIThisType, SiteStatsType } from '@types';

export const action = routerUtils.formAction;

const SiteStatisticsPage = ({ loaderData }: { loaderData: SiteStatisticsPageProps }) =>
{
	const { stats, date, lineGraphStats, barGraphStats } = loaderData;

	return (
		<div className='SiteStatisticsPage'>
			<RequireUser>
				<Header
					name='Site Statistics'
					description={dateUtils.isBefore(date, constants.launchDate) ? 'Some statistics will not show for dates before our launch date of September 25th, 2023.' : null}
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
						</div>,
					)}
				</ContentBox>
				<ContentBox>
					<h2>Stats Last 14 Days:</h2>
					<RequireLargeScreen size='657'>
						<LineChart
							width={500}
							height={300}
							data={lineGraphStats.statData}
							margin={{
								top: 5,
								right: 30,
								left: 20,
								bottom: 5,
							}}
						>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis type='category' dataKey='name' />
							<YAxis type='number' />
							<Tooltip />
							<Legend />
							{lineGraphStats.lines.map(name =>
								<Line type='monotone' dataKey={name} stroke={utils.getRandomColor()} key={name} />,
							)}
						</LineChart>
						<h2>Stats Each Year:</h2>
						{barGraphStats.map(s =>
							<BarChart
								width={500}
								height={300}
								data={s.data}
								margin={{
									top: 5,
									right: 30,
									left: 100,
									bottom: 5,
								}}
								key={s.name}
							>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis type='category' dataKey='year' />
								<YAxis type='number' />
								<Tooltip />
								<Legend />
								<Bar dataKey={s.name} fill={utils.getRandomColor()} />
							</BarChart>,
						)}
					</RequireLargeScreen>
				</ContentBox>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { date }: { date?: string }): Promise<SiteStatisticsPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/analytics/stats', {
			date: date ? date : '',
		}),
	]);

	return {
		stats: returnValue.results,
		date: returnValue.date,
		lineGraphStats: returnValue.lineGraphStats,
		barGraphStats: returnValue.barGraphStats,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type SiteStatisticsPageProps = {
	stats: SiteStatsType['results']
	date: SiteStatsType['date']
	lineGraphStats: SiteStatsType['lineGraphStats']
	barGraphStats: SiteStatsType['barGraphStats']
};

export default SiteStatisticsPage;
