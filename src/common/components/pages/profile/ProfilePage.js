import React from 'react';
import { useLoaderData, Outlet } from 'react-router-dom';

import ProfileBanner from '@/pages/headers/ProfileBanner.js';

const ProfilePage = () =>
{
	const {user, birthday, age, usernameHistory, buddies, whitelistedUsers, error} = useLoaderData();

	/**
	 * Sometimes react-router will start rendering the profile page before
	 * figuring out the given username's id
	 */
	if (error)
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
		/>
		<div className='ProfilePage'>
			<Outlet context={{user}} />
		</div>
		</>
	);
}

export async function loadData({id})
{
	if (isNaN(id))
	{
		return {
			error: 'unknown'
		};
	}

	const [user, birthdayInfo, usernameHistory, buddies, whitelistedUsers] = await Promise.all([
		this.query('v1/user', {id: id}),
		this.query('v1/users/birthday', {id}),
		this.query('v1/users/username_history', {id}),
		this.query('v1/users/buddies'),
		this.query('v1/friend_code/whitelist/users'),
	]);

	return {
		user: user,
		birthday: birthdayInfo.birthday,
		age: birthdayInfo.age,
		usernameHistory,
		buddies,
		whitelistedUsers
	};
}

export default ProfilePage;