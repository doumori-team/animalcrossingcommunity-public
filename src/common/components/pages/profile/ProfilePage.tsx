import React from 'react';
import { useLoaderData, Outlet } from 'react-router-dom';

import ProfileBanner from '@/pages/headers/ProfileBanner.tsx';
import { APIThisType, UserType, BirthdayType, AccountUserType, BuddiesType, WhitelistUserType, UserDonationsType } from '@types';
import { utils } from '@utils';

const ProfilePage = () =>
{
	const {user, birthday, age, usernameHistory, buddies, whitelistedUsers,
		error, userDonations} = useLoaderData() as ProfilePageProps;

	/**
	 * Sometimes react-router will start rendering the profile page before
	 * figuring out the given username's id
	 */
	if (error || user === undefined || birthday === undefined || age === undefined || usernameHistory === undefined || buddies === undefined || whitelistedUsers === undefined || userDonations === undefined)
	{
		return null;
	}

	return (
		<>
		<ProfileBanner
			user={user}
			birthday={birthday}
			age={age}
			usernameHistory={usernameHistory}
			buddies={buddies}
			whitelistedUsers={whitelistedUsers}
			userDonations={userDonations}
		/>
		<div className='ProfilePage'>
			<Outlet context={{user}} />
		</div>
		</>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<ProfilePageProps>
{
	if (!utils.isNumber(id))
	{
		return {
			error: 'unknown'
		};
	}

	const [user, birthdayInfo, usernameHistory, buddies, whitelistedUsers, userDonations] = await Promise.all([
		this.query('v1/user', {id: id}),
		this.query('v1/users/birthday', {id}),
		this.query('v1/users/username_history', {id}),
		this.query('v1/users/buddies'),
		this.query('v1/friend_code/whitelist/users'),
		this.query('v1/users/donations', {id: id}),
	]);

	return {
		user: user,
		birthday: birthdayInfo.birthday,
		age: birthdayInfo.age,
		usernameHistory,
		buddies: buddies.buddies,
		whitelistedUsers,
		userDonations,
	};
}

type ProfilePageProps = {
	user?: UserType
	birthday?: BirthdayType['birthday']
	age?: BirthdayType['age']
	usernameHistory?: AccountUserType['username_history']
	buddies?: BuddiesType['buddies']
	whitelistedUsers?: WhitelistUserType[]
	userDonations?: UserDonationsType
	error?: string
}

export default ProfilePage;