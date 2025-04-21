import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import { ContentBox } from '@layout';
import DonateButton from '@/components/layout/DonateButton.tsx';
import { Section, Grid, InnerSection } from '@layout';
import { UserContext } from '@contexts';
import { APIThisType, DonationsType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const HonoraryCitizensPage = ({ loaderData }: { loaderData: HonoraryCitizensPageProps }) =>
{
	const { users } = loaderData;

	return (
		<div className='HonoraryCitizensPage'>
			<ContentBox>
				<div>
					ACC would like to thank everyone who has contributed to our site. Below is a list of the generous members who have donated to ACC.
				</div>
				<RequireUser silent>
					<div className='HonoraryCitizensPage_donate'>
						If you're interested in getting on this list, you can find more details by clicking the <DonateButton /> button at the botton of ACC.
					</div>
				</RequireUser>
			</ContentBox>
			<Section>
				<UserContext.Consumer>
					{currentUser =>
						<Grid message='No donations found.' options={users}>
							{users.map((user, index) =>
								<InnerSection key={index}>
									<div className='HonoraryCitizensPage_user'>
										{currentUser ?
											<><Link to={`/profile/${encodeURIComponent(user.id)}`}>
												{user.username}
											</Link> (${user.donations})</>
											:
											<>{user.username} (${user.donations})</>
										}
									</div>
								</InnerSection>,
							)}
						</Grid>
					}
				</UserContext.Consumer>
			</Section>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<HonoraryCitizensPageProps>
{
	const [users] = await Promise.all([
		this.query('v1/donations'),
	]);

	return { users };
}

export const loader = routerUtils.wrapLoader(loadData);

type HonoraryCitizensPageProps = {
	users: DonationsType[]
};

export default HonoraryCitizensPage;
