import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import ProfileGeneralInfo from '@/components/profile/ProfileGeneralInfo.tsx';
import Avatar from '@/components/nodes/Avatar.tsx';
import NavMenu from '@/components/layout/NavMenu.tsx';
import { UserContext } from '@contexts';
import { ReportProblem } from '@layout';
import { constants } from '@utils';
import { UserType, BirthdayType, AccountUserType, BuddiesType, WhitelistUserType, UserDonationsType } from '@types';

const ProfileBanner = ({
	user,
	birthday,
	age,
	usernameHistory,
	buddies,
	whitelistedUsers,
	userDonations,
}: ProfileBannerProps) =>
{
	return (
		<div className='ProfileBanner'>
			<h1>
				<ReportProblem
					type={constants.userTicket.types.profileUsername}
					id={user.id}
				/>{user.username}
			</h1>
			<span className='ProfilePage_subsection'>
				<UserContext.Consumer>
					{currentUser => currentUser && (
						currentUser.id === user.id ?
							<Link to='/settings/avatar'>
								<Avatar {...user.avatar} />
							</Link>
							:
							<Avatar {...user.avatar} />

					)}
				</UserContext.Consumer>
			</span>
			<span className='ProfilePage_subsection'>
				<ProfileGeneralInfo
					user={user}
					birthday={birthday}
					age={age}
					usernameHistory={usernameHistory}
					buddies={buddies}
					whitelistedUsers={whitelistedUsers}
					userDonations={userDonations}
				/>
			</span>
			<NavMenu>
				<NavMenu.Button path={`/profile/${user.id}`} index>
					User Bio
				</NavMenu.Button>
				<NavMenu.Button path={`/profile/${user.id}/towns`}>
					Towns
				</NavMenu.Button>
				<NavMenu.Button path={`/profile/${user.id}/friend-codes`}>
					Friend Codes
				</NavMenu.Button>
				<RequirePermission permission='process-user-tickets' silent>
					<NavMenu.Button path={`/profile/${user.id}/security`}>
						Admin
					</NavMenu.Button>
				</RequirePermission>
			</NavMenu>
		</div>
	);
};

type ProfileBannerProps = {
	user: UserType
	birthday: BirthdayType['birthday']
	age: BirthdayType['age']
	usernameHistory: AccountUserType['username_history']
	buddies: BuddiesType['buddies']
	whitelistedUsers: WhitelistUserType[]
	userDonations: UserDonationsType
};

export default ProfileBanner;
