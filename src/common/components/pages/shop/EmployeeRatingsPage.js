import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants } from '@utils';
import { Header, Pagination, Section, Grid } from '@layout';
import { UserContext } from '@contexts';
import Rating from '@/components/ratings/Rating.js';
import TotalRatings from '@/components/ratings/TotalRatings.js';

const EmployeeRatingsPage = () =>
{
	const {ratings, page, pageSize, totalCount, user} = useLoaderData();

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='EmployeeRatingsPage'>
			<RequireUser silent>
				<UserContext.Consumer>
					{scout => scout && (
						<>
						<Header
							name='Employee Ratings'
							links={
								<>
								<Link to='/shops'>Shops</Link>
								</>
							}
						>
							<TotalRatings
								positiveRatingsTotal={user.positiveShopRatingsTotal}
								neutralRatingsTotal={user.neutralShopRatingsTotal}
								negativeRatingsTotal={user.negativeShopRatingsTotal}
								type={constants.rating.types.shop}
							/>
						</Header>

						<Section>
							<Grid options={ratings} message='This user has no ratings.'>
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
								startLink={`/shop/ratings/${encodedId}`}
							/>
						</Section>
						</>
					)}
					</UserContext.Consumer>
			</RequireUser>
		</div>
	);
}

export async function loadData({userId}, {page})
{
	const [ratings, user] = await Promise.all([
		this.query('v1/users/ratings_received', {
			id: userId,
			page: page ? page : 1,
			type: constants.rating.types.shop
		}),
		this.query('v1/users/ratings', {id: userId}),
	]);

	return {
		ratings: ratings.results,
		totalCount: ratings.count,
		page: ratings.page,
		pageSize: ratings.pageSize,
		user: user,
	};
}

export default EmployeeRatingsPage;
