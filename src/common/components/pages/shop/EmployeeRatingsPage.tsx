import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import { constants, routerUtils } from '@utils';
import { Header, Pagination, Section, Grid } from '@layout';
import { UserContext } from '@contexts';
import Rating from '@/components/ratings/Rating.tsx';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import { APIThisType, RatingsReceivedType, UserRatingType } from '@types';

export const action = routerUtils.formAction;

const EmployeeRatingsPage = ({ loaderData }: { loaderData: EmployeeRatingsPageProps }) =>
{
	const { ratings, page, pageSize, totalCount, user } = loaderData;

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='EmployeeRatingsPage'>
			<RequireUser silent>
				<UserContext.Consumer>
					{scout => scout &&
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
										/>,
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
					}
				</UserContext.Consumer>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { page }: { page?: string }): Promise<EmployeeRatingsPageProps>
{
	const [ratings, user] = await Promise.all([
		this.query('v1/users/ratings_received', {
			id: userId,
			page: page ? page : 1,
			type: constants.rating.types.shop,
		}),
		this.query('v1/users/ratings', { id: userId }),
	]);

	return {
		ratings: ratings.results,
		totalCount: ratings.count,
		page: ratings.page,
		pageSize: ratings.pageSize,
		user: user,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type EmployeeRatingsPageProps = {
	ratings: RatingsReceivedType['results']
	totalCount: RatingsReceivedType['count']
	page: RatingsReceivedType['page']
	pageSize: RatingsReceivedType['pageSize']
	user: UserRatingType
};

export default EmployeeRatingsPage;
