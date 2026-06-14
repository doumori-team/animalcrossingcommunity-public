import { Link, Params } from 'react-router';

import { RequireUser } from '@behavior';
import { Form, Text, Check, Select } from '@form';
import { Pagination, Header, Search, Section, Grid } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, TopBellsType } from '@types';

export const action = routerUtils.formAction;

const TopBellsPage = ({ loaderData }: { loaderData: TopBellsPageProps }) =>
{
	const { totalCount, users, page, pageSize, order, reverse, searchUser, lastJackpot, type } = loaderData;

	const link = `&searchUser=${encodeURIComponent(searchUser)}
		&order=${encodeURIComponent(order)}
		&reverse=${encodeURIComponent(reverse)}
		&type=${encodeURIComponent(type)}
	`;

	return (
		<div className='TopBellsPage'>
			<RequireUser>
				<Header
					name='Top Bells'
					description={`Top Bells shows you who has collected the most bells on ACC. You can also use the search features below to see a variety of other statistics like who has claimed the most recent jackpot and even who has missed the most bells. If you have more questions about how to get bells or the jackpot view our FAQ's.`}
					description2={lastJackpot ? `The last jackpot was claimed by ${lastJackpot.username} on ${lastJackpot.formattedOffered} for ${lastJackpot.amount} Bells.` : null}
				/>

				<Search callback='/top-bells'>
					<Form.Group>
						<Text
							label='User'
							name='searchUser'
							value={searchUser}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Sort By'
							name='order'
							value={order}
							options={constants.orderOptions.topBells}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Order'
							options={constants.reverseOptions}
							name='reverse'
							defaultValue={[reverse]}
						/>
					</Form.Group>
					<Form.Group>
						<Check
							label='Type'
							options={constants.bellTypeOptions}
							name='type'
							defaultValue={[type]}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid message='No bell records found.' options={users}>
						{users.map((user: TopBellsType['results'][number], index: number) =>
							<div className='TopBellsPage_user' key={index}>
								<div className='TopBellsPage_username'>
									Username: <Link to={`/profile/${encodeURIComponent(user.id)}`}>
										{user.username}
									</Link>
								</div>

								<div className='TopBellsPage_rank'>
									Rank: {user.rank}
								</div>

								<div className='TopBellsPage_totalBells'>
									Total Bells: {user.totalBells}
								</div>

								<div className='TopBellsPage_missedBells'>
									Missed Bells: {user.missedBells}
								</div>

								<div className='TopBellsPage_totalJackpotBells'>
									Total Jackpot Bells: {user.totalJackpotBells}
								</div>

								<div className='TopBellsPage_jackpotsFound'>
									Jackpots Found: {user.jackpotsFound}
								</div>

								<div className='TopBellsPage_jackpotsMissed'>
									Jackpots Missed: {user.jackpotsMissed}
								</div>
							</div>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`top-bells`}
						endLink={link}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, _: Params, { page, order, reverse, searchUser, type }: { page?: string, order?: string, reverse?: string, searchUser?: string, type?: string }): Promise<TopBellsPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/top_bells', {
			page: page ? page : 1,
			order: order ? order : 'rank',
			reverse: reverse ? reverse : 'false',
			searchUser: searchUser ? searchUser : '',
			type: type ? type : 'seasonal',
		}),
	]);

	return {
		users: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		searchUser: returnValue.searchUser,
		order: returnValue.order,
		reverse: returnValue.reverse,
		lastJackpot: returnValue.lastJackpot,
		type: returnValue.type,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type TopBellsPageProps = {
	users: TopBellsType['results']
	totalCount: TopBellsType['count']
	page: TopBellsType['page']
	pageSize: TopBellsType['pageSize']
	searchUser: TopBellsType['searchUser']
	order: TopBellsType['order']
	reverse: TopBellsType['reverse']
	lastJackpot: TopBellsType['lastJackpot']
	type: TopBellsType['type']
};

export default TopBellsPage;
