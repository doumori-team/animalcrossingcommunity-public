import { Link, Params } from 'react-router';

import { RequirePermission } from '@behavior';
import { Form, Text, Select } from '@form';
import { Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants, dateUtils, routerUtils } from '@utils';
import { APIThisType, UserMatchingType } from '@types';

export const action = routerUtils.formAction;

const UserMatchingPage = ({ loaderData }: { loaderData: UserMatchingPageProps }) =>
{
	const { searchUser, matches, match } = loaderData;

	return (
		<div className='UserMatchingPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name='User Matching' />

				<Search callback='/user-matching'>
					<Form.Group>
						<Text
							label='User'
							name='searchUser'
							value={searchUser}
							maxLength={constants.max.searchUsername}
							required
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Match'
							name='match'
							value={match}
							options={Object.keys(constants.matching).map(key =>
							{
								return {
									label: constants.matching[key],
									value: constants.matching[key],
								};
							})}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid message='No user matches found.' options={matches}>
						{matches.map((match, index) =>
							<InnerSection key={index}>
								<div className='UserMatchingPage_matchUser'>
									User: <Link to={`/profile/${encodeURIComponent(match.user.id)}`}>
										{match.user.username}
									</Link> ({dateUtils.formatDate(match.user.signupDate)})
								</div>
							</InnerSection>,
						)}
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, _: Params, { page, searchUser, match }: { page?: string, searchUser?: string, match?: string }): Promise<UserMatchingPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/matching', {
			page: page ? page : 1,
			searchUser: searchUser ? searchUser : '',
			match: match ? match : constants.matching.friendCodes,
		}),
	]);

	return {
		matches: returnValue.results,
		searchUser: returnValue.searchUser,
		match: returnValue.match,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type UserMatchingPageProps = {
	matches: UserMatchingType['results']
	searchUser: UserMatchingType['searchUser']
	match: UserMatchingType['match']
};

export default UserMatchingPage;
