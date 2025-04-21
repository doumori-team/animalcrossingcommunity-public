import { Link } from 'react-router';

import { RequireUser, RequirePermission } from '@behavior';
import Tune from '@/components/tunes/Tune.tsx';
import { Form, Text } from '@form';
import { Pagination, Header, Section, Grid, Search } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, TunesType } from '@types';

export const action = routerUtils.formAction;

const TunesPage = ({ loaderData }: { loaderData: TunesPageProps }) =>
{
	const { totalCount, tunes, page, name, creator, pageSize } = loaderData;

	const link = `&creator=${encodeURIComponent(creator)}
		&name=${encodeURIComponent(name)}
	`;

	return (
		<div className='TunesPage'>
			<RequirePermission permission='view-tunes'>
				<Header
					name='Town Tunes'
					description='Need a new Town Tune? You can create your next tune by clicking "Create a Tune" above. You can also search for a Town Tune below by using the tune name or username of its creator. Clicking "Use as Town Tune" will prompt you to add that tune to one of your towns listed on your profile.'
					links={
						<RequireUser silent>
							<Link to='/town-tunes/add'>
								Create a Tune
							</Link>
						</RequireUser>
					}
				/>

				<Search callback='/town-tunes'>
					<Form.Group>
						<Text
							name='name'
							label='Tune Name'
							value={name}
							maxLength={constants.max.tuneName}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							name='creator'
							label='Tune Creator'
							value={creator}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='tune' options={tunes}>
						{tunes.map((tune, index) =>
							<Tune key={index} tune={tune} />,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`town-tunes`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { page, name, creator }: { page?: string, name?: string, creator?: string }): Promise<TunesPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/tunes', {
			page: page ? page : 1,
			name: name ? name : '',
			creator: creator ? creator : '',
		}),
	]);

	return {
		tunes: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		name: returnValue.name,
		creator: returnValue.creator,
		pageSize: returnValue.pageSize,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type TunesPageProps = {
	tunes: TunesType['results']
	totalCount: TunesType['count']
	page: TunesType['page']
	name: TunesType['name']
	creator: TunesType['creator']
	pageSize: TunesType['pageSize']
};

export default TunesPage;
