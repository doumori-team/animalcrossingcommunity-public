import { Link, useOutletContext, Outlet } from 'react-router';

import { RequireUser } from '@behavior';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import { utils, constants, routerUtils } from '@utils';
import { Header } from '@layout';
import { APIThisType, UserRatingType, UserType } from '@types';

export const action = routerUtils.formAction;

const ProfileFriendCodesPage = ({ loaderData }: { loaderData: ProfileFriendCodesPageProps }) =>
{
	const { userRatings } = loaderData;
	const { user } = useOutletContext() as { user: UserType };

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='ProfileFriendCodesPage'>
			<RequireUser permission='use-friend-codes'>
				<Header
					name={`${utils.getPossessiveNoun(user.username)} Friend Codes`}
					link={`/profile/${encodedId}/friend-codes`}
					links={
						<>
							<Link to={`/ratings/${encodedId}/${constants.rating.types.wifi}`}>
								Wifi Ratings
							</Link>
							<Link to={`/trading-post/${encodedId}/all`}>
								Trades
							</Link>
							<Link to={`/ratings/${encodedId}/${constants.rating.types.trade}`}>
								Trade Ratings
							</Link>
							<RequireUser id={user.id} silent>
								<Link to={`/profile/${encodedId}/friend-code/add`}>
									Add Friend Code
								</Link>
							</RequireUser>
						</>
					}
				>
					<TotalRatings
						positiveRatingsTotal={userRatings.positiveWifiRatingsTotal}
						neutralRatingsTotal={userRatings.neutralWifiRatingsTotal}
						negativeRatingsTotal={userRatings.negativeWifiRatingsTotal}
						type={constants.rating.types.wifi}
					/>
				</Header>

				<Outlet />
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<ProfileFriendCodesPageProps>
{
	const [userRatings] = await Promise.all([
		this.query('v1/users/ratings', { id }),
	]);

	return { userRatings };
}

export const loader = routerUtils.wrapLoader(loadData);

type ProfileFriendCodesPageProps = {
	userRatings: UserRatingType
};

export default ProfileFriendCodesPage;
