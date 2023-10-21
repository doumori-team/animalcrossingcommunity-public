import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireGroup } from '@behavior';
import { constants, dateUtils } from '@utils';
import { Header, Pagination, Section, Grid, InnerSection } from '@layout';
import StatusIndicator from '@/components/nodes/StatusIndicator.js';
import { UserContext } from '@contexts';

const NewMembersPage = () =>
{
	const {newMembers, page, pageSize, totalCount} = useLoaderData();

	return (
		<div className='NewMembersPage'>
			<RequirePermission permission='scout-pages'>
				<Header
					name='New Members'
					links={
						<>
						<Link to={`/scout-hub`}>Scout Hub</Link>
						<Link to={`/scout-hub/new-members`}>New Members</Link>
						<RequireGroup group={constants.staffIdentifiers.scout} silent>
							<Link to={`/scout-hub/settings`}>Settings</Link>
							<UserContext.Consumer>
								{scout => scout && (
									<Link to={`/scout-hub/ratings/${encodeURIComponent(scout.id)}`}>
										Feedback
									</Link>
								)}
							</UserContext.Consumer>
						</RequireGroup>
						<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
							Adoptee BT
						</Link>
						<RequirePermission permission='adoption-bt-settings' silent>
							<Link to={`/scout-hub/adoption/settings`}>
								Adoptee BT Settings
							</Link>
						</RequirePermission>
						</>
					}
				/>

				<Section>
					<Grid name='new member' options={newMembers}>
						{newMembers.map((user, index) =>
							<InnerSection key={index}>
								<div className='NewMembersPage_newMemberName'>
									<Link to={`/profile/${encodeURIComponent(user.id)}`}>
										{user.username}
									</Link>
								</div>

								<div className='NewMembersPage_lastActive'>
									Last Online: <StatusIndicator lastActiveTime={user.lastActiveTime} showDate={true} />
								</div>

								<div className='NewMembersPage_signupDate'>
									Signup Date: {dateUtils.formatDate(user.signupDate)}
								</div>

								<div className='NewMembersPage_adoptionDate'>
									Adoption Date: {user.adopted ? user.adopted : 'Not Adopted'}
								</div>

								{user.adopted && (
									<div className='NewMembersPage_adoptingScout'>
										Adopted By: <Link to={`/profile/${encodeURIComponent(user.scoutId)}`}>
											{user.scoutUsername}
										</Link>
									</div>
								)}

								<div className='NewMembersPage_actions'>
									<RequirePermission permission='adoption-reassign' silent>
										<Link to={`/scout-hub/new-members/reassign/${user.id}`}>
											Reassign
										</Link>
									</RequirePermission>
								</div>
							</InnerSection>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`scout-hub/new-members`}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, {page})
{
	const [result] = await Promise.all([
		this.query('v1/users/new', {
			page: page ? page : 1,
		}),
	]);

	return {
		newMembers: result.newUsers,
		totalCount: result.totalCount,
		page: result.page,
		pageSize: result.pageSize,
	};
}

export default NewMembersPage;
