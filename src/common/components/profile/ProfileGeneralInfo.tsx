import React from 'react';
import { Link } from 'react-router-dom';

import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { dateUtils, constants } from '@utils';
import { UserContext } from '@contexts';
import { RequirePermission } from '@behavior';
import { Form, Confirm } from '@form';
import { UserType, BirthdayType, AccountUserType, BuddiesType, WhitelistUserType, UserDonationsType } from '@types';

const ProfileGeneralInfo = ({
	user,
	userDonations,
	birthday,
	age,
	usernameHistory,
	buddies,
	whitelistedUsers,
}: ProfileGeneralInfoProps) =>
{
	return (
		<div className='ProfileGeneralInfo'>
			<div className='ProfileGeneralInfo_field'>
				<span className='ProfileGeneralInfo_fieldname'>Username History: </span>
				{usernameHistory.length > 0 ?
					<ul className='ProfileGeneralInfo_usernameHistory'>
						{usernameHistory.map((history, index) =>
							<li key={index} className='ProfileGeneralInfo_usernameChange'>
								{history.username}
							</li>,
						)}
					</ul>
					:
					'No history found.'
				}
			</div>
			<div className='ProfileGeneralInfo_field'>
				<span className='ProfileGeneralInfo_fieldname'>Member since: </span>
				{dateUtils.formatDate(user.signupDate)}
			</div>
			<div className='ProfileGeneralInfo_field'>
				<span className='ProfileGeneralInfo_fieldname'>Last active: </span>
				<StatusIndicator lastActiveTime={user.lastActiveTime} showDate={true} />
			</div>
			{user.awayStartDate && user.awayEndDate &&
				<div className='ProfileGeneralInfo_field'>
					<span className='ProfileGeneralInfo_fieldname'>Away: </span>
					{dateUtils.formatDate(user.awayStartDate)} to {dateUtils.formatDate(user.awayEndDate)}
				</div>
			}
			<div className='ProfileGeneralInfo_field'>
				<span className='ProfileGeneralInfo_fieldname'>Bell Count: </span>
				{user.allBells}
			</div>
			{birthday &&
				<div className='ProfileGeneralInfo_field'>
					<span className='ProfileGeneralInfo_fieldname'>Birthday: </span>
					{birthday} {age &&
						<span>({age})</span>
					}
				</div>
			}
			{!birthday && age &&
				<div className='ProfileGeneralInfo_field'>
					<span className='ProfileGeneralInfo_fieldname'>Age: </span>
					{age}
				</div>
			}
			<div className='ProfileGeneralInfo_field'>
				<span className='ProfileGeneralInfo_fieldname'>Donations: </span>
				${userDonations.donations} (${userDonations.perks})
			</div>
			<UserContext.Consumer>
				{currentUser => currentUser?.id !== user.id &&
					<div className='ProfileGeneralInfo_field ProfileGeneralInfo_icons'>
						{!whitelistedUsers?.find(u => u.id === user.id) &&
							<RequirePermission permission='use-friend-codes' silent>
								<Confirm
									action='v1/friend_code/whitelist/save'
									defaultSubmitImage={`${constants.AWS_URL}/images/icons/wifi.png`}
									imageTitle='Whitelist User'
									additionalBody={
										<>
											<input type='hidden' name='whiteListUser' value={user.username} />
											<input type='hidden' name='action' value='add' />
										</>
									}
									label='Whitelist User'
									message='Whitelisting this user will allow them to see all your Friend Codes. Do you wish to proceed?'
								/>{' • '}
							</RequirePermission>
						}
						{!buddies?.find(b => b.id === user.id) &&
							<RequirePermission permission='use-buddy-system' silent>
								<Form
									action='v1/users/buddy/save'
									defaultSubmitImage={`${constants.AWS_URL}/images/icons/buddy.png`}
									imageTitle={`Add ${user.username} to your buddy list`}
								>
									<input type='hidden' name='buddyUsers' value={user.username} />
									<input type='hidden' name='action' value='add' />
								</Form>{' • '}
							</RequirePermission>
						}
						<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${user.username}#TextBox`}>
							<img
								src={`${constants.AWS_URL}/images/icons/pt.png`}
								title={`Send a PT to ${user.username}`}
								alt={`Send a PT to ${user.username}`}
							/>
						</Link>
					</div>
				}
			</UserContext.Consumer>
		</div>
	);
};

type ProfileGeneralInfoProps = {
	user: UserType
	userDonations: UserDonationsType
	birthday: BirthdayType['birthday']
	age: BirthdayType['age']
	usernameHistory: AccountUserType['username_history']
	buddies: BuddiesType['buddies']
	whitelistedUsers: WhitelistUserType[]
};

export default ProfileGeneralInfo;
