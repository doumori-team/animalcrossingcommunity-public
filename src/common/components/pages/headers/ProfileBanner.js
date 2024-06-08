import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { userShape } from '@propTypes';
import ProfileGeneralInfo from '@/components/profile/ProfileGeneralInfo.js';
import Avatar from '@/components/nodes/Avatar.js';
import NavMenu from '@/components/layout/NavMenu.js';
import { UserContext } from '@contexts';
import { ReportProblem } from '@layout';
import { constants } from '@utils';

const ProfileBanner = ({user, birthday, age, usernameHistory, buddies, whitelistedUsers, userDonations}) =>
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
						currentUser.id === user.id ? (
							<Link to='/settings/avatar'>
								<Avatar {...user.avatar} />
							</Link>
						) : (
							<Avatar {...user.avatar} />
						)
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
}

ProfileBanner.propTypes = {
	user: userShape,
	birthday: PropTypes.any,
	age: PropTypes.number,
	usernameHistory: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
		changed: PropTypes.any,
	})),
	buddies: PropTypes.arrayOf(userShape),
	whitelistedUsers: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
	})),
	userDonations: PropTypes.shape({
		id: PropTypes.number,
		perks: PropTypes.number,
		donations: PropTypes.number,
		monthlyPerks: PropTypes.number,
	}),
}

export default ProfileBanner;
