import { Outlet, redirect, Params } from 'react-router';

import ProfileBanner from '@/pages/headers/ProfileBanner.tsx';
import {
	APIThisType,
	UserType,
	BirthdayType,
	AccountUserType,
	BuddiesType,
	WhitelistUserType,
	UserDonationsType,
	UserLiteType,
	AppLoadContextType,
} from '@types';
import { routerUtils } from '@utils';
import { iso } from 'common/iso.ts';

export const action = routerUtils.formAction;

const ProfilePage = ({ loaderData }: { loaderData: ProfilePageProps }) =>
{
	const { user, birthday, age, usernameHistory, buddies, whitelistedUsers,
		userDonations } = loaderData;

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
				<Outlet context={{ user }} />
			</div>
		</>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<ProfilePageProps>
{
	const [user, birthdayInfo, usernameHistory, buddies, whitelistedUsers, userDonations] = await Promise.all([
		this.query('v1/user', { id: id }),
		this.query('v1/users/birthday', { id }),
		this.query('v1/users/username_history', { id }),
		this.query('v1/users/buddies'),
		this.query('v1/friend_code/whitelist/users'),
		this.query('v1/users/donations', { id: id }),
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

export const loader = async ({ context, params, request }: { context: AppLoadContextType, params: Params; request: any }) =>
{
	if (isNaN(Number(params.id)))
	{
		return (await iso).query(null, 'v1/user_lite', { username: params.id })
			.then((data: UserLiteType) =>
			{
				return redirect(`/profile/${encodeURIComponent(data.id)}`);
			})
			.catch((error: any) =>
			{
				console.error('Throwing profile route error:', error);

				// see ErrorBoundary
				let status = 500;

				if (error.name === 'UserError' || error.name === 'ProfanityError')
				{
					status = 400;
				}

				throw Response.json(
					error,
					{ status },
				);
			});
	}

	return routerUtils._getLoaderFunction(loadData, params, request, context);
};

type ProfilePageProps = {
	user: UserType
	birthday: BirthdayType['birthday']
	age: BirthdayType['age']
	usernameHistory: AccountUserType['username_history']
	buddies: BuddiesType['buddies']
	whitelistedUsers: WhitelistUserType[]
	userDonations: UserDonationsType
};

export default ProfilePage;
