import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Form, Text, Select } from '@form';
import { Header, Search, Section, Grid, InnerSection } from '@layout';
import { constants, dateUtils, routerUtils } from '@utils';
import { APIThisType, UserMatchingType } from '@types';

export const action = routerUtils.formAction;

const UserMatchingPage = ({ loaderData }: { loaderData: UserMatchingPageProps }) =>
{
	const { username, matches, match } = loaderData;

	return (
		<div className='UserMatchingPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name='User Matching' />

				<Search callback='/user-matching'>
					<Form.Group>
						<Text
							label='User'
							name='username'
							value={username}
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
									label: (constants.matching as any)[key],
									value: (constants.matching as any)[key],
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

async function loadData(this: APIThisType, _: any, { page, username, match }: { page?: string, username?: string, match?: string }): Promise<UserMatchingPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/matching', {
			page: page ? page : 1,
			username: username ? username : '',
			match: match ? match : constants.matching.friendCodes,
		}),
	]);

	return {
		matches: returnValue.results,
		username: returnValue.username,
		match: returnValue.match,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type UserMatchingPageProps = {
	matches: UserMatchingType['results']
	username: UserMatchingType['username']
	match: UserMatchingType['match']
};

export default UserMatchingPage;
