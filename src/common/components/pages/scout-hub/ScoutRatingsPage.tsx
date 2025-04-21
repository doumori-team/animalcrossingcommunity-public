import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { constants, routerUtils } from '@utils';
import { Header, Pagination, Section, Grid } from '@layout';
import { UserContext } from '@contexts';
import Rating from '@/components/ratings/Rating.tsx';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import { APIThisType, RatingsReceivedType, UserRatingType } from '@types';

export const action = routerUtils.formAction;

const ScoutRatingsPage = ({ loaderData }: { loaderData: ScoutRatingsPageProps }) =>
{
	const { ratings, page, pageSize, totalCount, user } = loaderData;

	const encodedId = encodeURIComponent(user.id);

	return (
		<div className='ScoutRatingsPage'>
			<RequirePermission permission='scout-pages' silent>
				<UserContext.Consumer>
					{scout => scout &&
						<>
							<Header
								name='Scout Ratings'
								links={
									<>
										<Link to={`/scout-hub`}>Scout Hub</Link>
										<Link to={`/scout-hub/new-members`}>New Members</Link>
										<Link to={`/scout-hub/settings`}>Settings</Link>
										<Link to={`/scout-hub/ratings`}>
											Feedback
										</Link>
										<Link to={`/scout-hub/adoption/${encodeURIComponent(constants.boardIds.adopteeBT)}`}>
											Adoptee BT
										</Link>
									</>
								}
							>
								<TotalRatings
									positiveRatingsTotal={user.positiveScoutRatingsTotal}
									neutralRatingsTotal={user.neutralScoutRatingsTotal}
									negativeRatingsTotal={user.negativeScoutRatingsTotal}
									type={constants.rating.types.scout}
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
									startLink={`/scout-hub/ratings/${encodedId}`}
								/>
							</Section>
						</>
					}
				</UserContext.Consumer>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { page }: { page?: string })
{
	const [ratings, user] = await Promise.all([
		this.query('v1/users/ratings_received', {
			id: userId,
			page: page ? page : 1,
			type: constants.rating.types.scout,
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

type ScoutRatingsPageProps = {
	ratings: RatingsReceivedType['results']
	totalCount: RatingsReceivedType['count']
	page: RatingsReceivedType['page']
	pageSize: RatingsReceivedType['pageSize']
	user: UserRatingType
};

export default ScoutRatingsPage;
