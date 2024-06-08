import React from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { constants } from '@utils';
import { RequireUser } from '@behavior';
import Listing from '@/components/trading_post/Listing.js';
import Offer from '@/components/trading_post/Offer.js';
import { UserContext } from '@contexts';
import { Header, Section, Grid, Pagination } from '@layout';

const UserListingPage = () =>
{
	const {listings, offers, selectedUserId, totalListingsCount, listingsPage,
		listingsPageSize, totalOffersCount, offersPage, offersPageSize} = getData(useAsyncValue());

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
							{currentUser => currentUser && (
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
							)}
						</UserContext.Consumer>
						</>
					}
				/>

				<Section>
					<h1 className='UserListingPage_name'>
						User Trades
					</h1>

					<Grid name='listing' options={listings}>
						{listings.map(listing =>
							<Listing
								key={listing.id}
								listing={listing}
							/>
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
						{offers.map(listing => {
							const offer = listing.offers.accepted &&
								listing.offers.accepted.user.id === selectedUserId ?
								listing.offers.accepted :
								listing.offers.list.find(o => o.user.id === selectedUserId);

							return <div key={offer.id}
								className='UserListingPage_listingOffer'>
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
}

export async function loadData({userId}, {listingsPage, offersPage})
{
	const selectedUserId = Number(userId);

	return Promise.all([
		this.query('v1/users/listings', {id: selectedUserId, page: listingsPage ? listingsPage : 1,}),
		this.query('v1/users/offers', {id: selectedUserId, page: offersPage ? offersPage : 1,}),
		selectedUserId,
	]);
}

function getData(data)
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

export default UserListingPage;
