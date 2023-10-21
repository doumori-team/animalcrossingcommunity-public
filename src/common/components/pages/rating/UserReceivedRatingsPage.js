import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { utils, constants } from '@utils';
import { RequireUser } from '@behavior';
import Rating from '@/components/ratings/Rating.js';
import { Pagination, Header, Section, Grid } from '@layout';
import TotalRatings from '@/components/ratings/TotalRatings.js';

const UserReceivedRatingsPage = () =>
{
	const {user, ratings, page, pageSize, totalCount, type} = useLoaderData();

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='UserReceivedRatingsPage'>
			<RequireUser permission='view-ratings'>
				<Header
					name={<>{utils.getPossessiveNoun(user.username)} <span className='capitalize'>{type}</span> Ratings &gt; Received</>}
					link={`/profile/${encodedId}/friend-codes`}
					links={
						<Link to={`/ratings/${encodedId}/${type}/given`}>
							Ratings Given
						</Link>
					}
				>
					<TotalRatings
						positiveRatingsTotal={type === constants.rating.types.wifi ? user.positiveWifiRatingsTotal : user.positiveTradeRatingsTotal}
						neutralRatingsTotal={type === constants.rating.types.wifi ? user.neutralWifiRatingsTotal : user.neutralTradeRatingsTotal}
						negativeRatingsTotal={type === constants.rating.types.wifi ? user.negativeWifiRatingsTotal : user.negativeTradeRatingsTotal}
						type={type}
					/>
				</Header>

				<Section>
					<Grid options={ratings} message='This user has no ratings'>
						{ratings.map(rating =>
							<Rating
								key={rating.id}
								rating={rating}
							/>
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`ratings/${encodedId}/${type}`}
					/>
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData({userId, type}, {page})
{
	const [ratings, user] = await Promise.all([
		this.query('v1/users/ratings_received', {
			id: userId,
			page: page ? page : 1,
			type: type
		}),
		this.query('v1/user', {id: userId}),
	]);

	return {
		user,
		ratings: ratings.results,
		totalCount: ratings.count,
		page: ratings.page,
		pageSize: ratings.pageSize,
		type: ratings.type,
	};
}

export default UserReceivedRatingsPage;
