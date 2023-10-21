import React from 'react';
import { Link, useOutletContext, Outlet } from 'react-router-dom';

import { RequireUser } from '@behavior';
import TotalRatings from '@/components/ratings/TotalRatings.js';
import { utils, constants } from '@utils';
import { Header } from '@layout';

const ProfileFriendCodesPage = () =>
{
	const {user} = useOutletContext();

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
						positiveRatingsTotal={user.positiveWifiRatingsTotal}
						neutralRatingsTotal={user.neutralWifiRatingsTotal}
						negativeRatingsTotal={user.negativeWifiRatingsTotal}
						type={constants.rating.types.wifi}
					/>
				</Header>

				<Outlet />
			</RequireUser>
		</div>
	);
}

export default ProfileFriendCodesPage;
