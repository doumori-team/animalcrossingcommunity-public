import { Link } from 'react-router';

import { RequirePermission, RequireGroup } from '@behavior';
import { constants, dateUtils, routerUtils } from '@utils';
import { Header, Pagination, Section, Grid, InnerSection } from '@layout';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { UserContext } from '@contexts';
import { APIThisType, UsersNewType } from '@types';

export const action = routerUtils.formAction;

const NewMembersPage = ({ loaderData }: { loaderData: NewMembersPageProps }) =>
{
	const { newMembers, page, pageSize, totalCount } = loaderData;

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
									{scout => scout &&
										<Link to={`/scout-hub/ratings/${encodeURIComponent(scout.id)}`}>
											Feedback
										</Link>
									}
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

								{!!user.adopted && !!user.scoutId &&
									<div className='NewMembersPage_adoptingScout'>
										Adopted By: <Link to={`/profile/${encodeURIComponent(user.scoutId)}`}>
											{user.scoutUsername}
										</Link>
									</div>
								}

								<div className='NewMembersPage_actions'>
									<RequirePermission permission='adoption-reassign' silent>
										<Link to={`/scout-hub/new-members/reassign/${user.id}`}>
											Reassign
										</Link>
									</RequirePermission>
								</div>
							</InnerSection>,
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
};

async function loadData(this: APIThisType, _: any, { page }: { page?: string }): Promise<NewMembersPageProps>
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

export const loader = routerUtils.wrapLoader(loadData);

type NewMembersPageProps = {
	newMembers: UsersNewType['newUsers']
	totalCount: UsersNewType['totalCount']
	page: UsersNewType['page']
	pageSize: UsersNewType['pageSize']
};

export default NewMembersPage;
