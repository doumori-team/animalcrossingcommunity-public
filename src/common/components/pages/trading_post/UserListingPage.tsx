import { use } from 'react';
import { Link, Params } from 'react-router';

import { constants, routerUtils } from '@utils';
import { RequireUser } from '@behavior';
import Listing from '@/components/trading_post/Listing.tsx';
import Offer from '@/components/trading_post/Offer.tsx';
import { UserContext } from '@contexts';
import { Header, Section, Grid, Pagination } from '@layout';
import { APIThisType, UserListingsType, UserOffersType, ListingType } from '@types';

export const action = routerUtils.formAction;

const UserListingPage = ({ loaderData, params }: { loaderData: Promise<UserListingPageProps>, params: Params }) =>
{
	const { listings, offers, totalListingsCount, listingsPage,
		listingsPageSize, totalOffersCount, offersPage, offersPageSize } = getData(use(loaderData));

	const { userId } = params;
	const selectedUserId = Number(userId);

	const link = `trading-post/${encodeURIComponent(selectedUserId)}/all`;

	return (
		<div className='UserListingPage'>
			<RequireUser permission='use-trading-post'>
				<Header
					name='Trading Post'
					links={
						<>
							<Link to={`/trading-post/add`}>
								Create a Listing
							</Link>
							<UserContext.Consumer>
								{currentUser => currentUser &&
									<>
										<Link to={`/trading-post/${encodeURIComponent(currentUser.id)}/all`}>
											My Trades
										</Link>
										<Link to={`/ratings/${encodeURIComponent(currentUser.id)}/${constants.rating.types.trade}`}>
											My Trade Ratings
										</Link>
										<Link to={`/catalog/${encodeURIComponent(currentUser.id)}`}>
											My Catalog
										</Link>
									</>
								}
							</UserContext.Consumer>
						</>
					}
				/>

				<Section>
					<h1 className='UserListingPage_name'>
						User Trades
					</h1>

					<Grid name='listing' options={listings}>
						{listings.map((listing: ListingType) =>
							<Listing
								key={listing.id}
								listing={listing}
							/>,
						)}
					</Grid>

					<Pagination
						page={listingsPage}
						pageSize={listingsPageSize}
						totalCount={totalListingsCount}
						startLink={link}
						pageName='listingsPage'
					/>
				</Section>

				<Section>
					<h1 className='UserListingPage_name'>
						User Offers
					</h1>

					<Grid name='offer' options={offers}>
						{offers.map((listing: ListingType) =>
						{
							const offer = listing.offers.accepted &&
								listing.offers.accepted.user.id === selectedUserId ?
								listing.offers.accepted :
								listing.offers.list.find(o => o.user.id === selectedUserId);

							if (!offer)
							{
								return null;
							}

							return <div key={offer.id}
								className='UserListingPage_listingOffer'
							>
								<Listing
									listing={listing}
								/>
								<Offer
									offer={offer}
									listing={listing}
								/>
							</div>;
						})}
					</Grid>

					<Pagination
						page={offersPage}
						pageSize={offersPageSize}
						totalCount={totalOffersCount}
						startLink={link}
						pageName='offersPage'
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { listingsPage, offersPage }: { listingsPage?: string, offersPage?: string }): Promise<any>
{
	const selectedUserId = Number(userId);

	return Promise.all([
		this.query('v1/users/listings', { id: selectedUserId, page: listingsPage ? listingsPage : 1 }),
		this.query('v1/users/offers', { id: selectedUserId, page: offersPage ? offersPage : 1 }),
	]);
}

function getData(data: any): UserListingPageProps
{
	const [listings, offers, selectedUserId] = data;

	return {
		selectedUserId,
		listings: listings.results,
		totalListingsCount: listings.count,
		listingsPage: listings.page,
		listingsPageSize: listings.pageSize,
		offers: offers.results,
		totalOffersCount: offers.count,
		offersPage: offers.page,
		offersPageSize: offers.pageSize,
	};
}

export const loader = routerUtils.deferLoader(loadData);

type UserListingPageProps = {
	selectedUserId: number
	listings: UserListingsType['results']
	totalListingsCount: UserListingsType['count']
	listingsPage: UserListingsType['page']
	listingsPageSize: UserListingsType['pageSize']
	offers: UserOffersType['results']
	totalOffersCount: UserOffersType['count']
	offersPage: UserOffersType['page']
	offersPageSize: UserOffersType['pageSize']
};

export default routerUtils.LoadingFunction(UserListingPage);
