import { Link } from 'react-router';

import { utils, routerUtils } from '@utils';
import { RequireUser } from '@behavior';
import Rating from '@/components/ratings/Rating.tsx';
import { Pagination, Header, Section, Grid } from '@layout';
import { APIThisType, RatingsGivenType, UserLiteType } from '@types';

export const action = routerUtils.formAction;

const UserGivenRatingsPage = ({ loaderData }: { loaderData: UserGivenRatingsPageProps }) =>
{
	const { user, ratings, page, pageSize, totalCount, type } = loaderData;

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='UserGivenRatingsPage'>
			<RequireUser permission='view-ratings'>
				<Header
					name={<>{utils.getPossessiveNoun(user.username)} <span className='capitalize'>{type}</span> Ratings &gt; Given</>}
					link={`/profile/${encodedId}/friend-codes`}
					links={
						<Link to={`/ratings/${encodedId}/${type}`}>
							Ratings Received
						</Link>
					}
				/>

				<Section>
					<Grid options={ratings} message='This user has given no ratings.'>
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
						startLink={`ratings/${encodedId}/${type}/given`}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { userId, type }: { userId: string, type: string }, { page }: { page?: string }): Promise<UserGivenRatingsPageProps>
{
	const [ratings, user] = await Promise.all([
		this.query('v1/users/ratings_given', { id: userId, page: page ? page : 1, type: type }),
		this.query('v1/user_lite', { id: userId }),
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

export const loader = routerUtils.wrapLoader(loadData);

type UserGivenRatingsPageProps = {
	user: UserLiteType
	ratings: RatingsGivenType['results']
	totalCount: RatingsGivenType['count']
	page: RatingsGivenType['page']
	pageSize: RatingsGivenType['pageSize']
	type: RatingsGivenType['type']
};

export default UserGivenRatingsPage;
