import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { ContentBox } from '@layout';
import DonateButton from '@/components/layout/DonateButton.js';
import { Section, Grid, InnerSection } from '@layout';

const HonoraryCitizensPage = () =>
{
	const {users} = useLoaderData();

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
				<Grid message='No donations found.' options={users}>
					{users.map((user, index) =>
						<InnerSection key={index}>
							<div className='HonoraryCitizensPage_user'>
								<Link to={`/profile/${encodeURIComponent(user.id)}`}>
									{user.username}
								</Link> (${user.donations})
							</div>
						</InnerSection>
					)}
				</Grid>
			</Section>
		</div>
	);
}

export async function loadData()
{
	const [users] = await Promise.all([
		this.query('v1/donations'),
	]);

	return {users};
}

export default HonoraryCitizensPage;