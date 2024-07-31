import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { UserContext } from '@contexts';
import { constants } from '@utils';
import { ListingType } from '@types';
import TotalRatings from '@/components/ratings/TotalRatings.tsx';
import { Confirm } from '@form';
import { ReportProblem } from '@layout';

const Listing = ({
	listing
}: ListingProps) =>
{
	const encodedId = encodeURIComponent(listing.id);

	return (
		<div className='Listing'>
			<div className='Listing_links'>
				<UserContext.Consumer>
					{currentUser => (currentUser &&
						currentUser.id !== listing.creator.id &&
						listing.status === constants.tradingPost.listingStatuses.open) && (
						<Link to={`/trading-post/${encodedId}/offer`} reloadDocument>
							Make an Offer
						</Link>
					)}
				</UserContext.Consumer>
				<RequireUser id={listing.creator.id} silent>
					{[
						constants.tradingPost.listingStatuses.open,
						constants.tradingPost.listingStatuses.offerAccepted
					].includes(listing.status) && (
						<Confirm
							action='v1/trading_post/listing/cancel'
							callback={'/trading-post'}
							id={listing.id}
							label='Cancel'
							message='Are you sure you want to cancel this listing?'
						/>
					)}
				</RequireUser>
			</div>

			<h1 className='Listing_name'>
				<ReportProblem type={constants.userTicket.types.listing} id={listing.id} />
				<Link to={`/trading-post/${encodedId}`}>
					Listing #{listing.id}
				</Link>
			</h1>

			{(listing.items.length > 0 || listing.bells > 0 || listing.residents.length > 0 || listing.comment) ? (
				<>
				<div className='Listing_create'>
					<UserContext.Consumer>
						{currentUser => (
							currentUser ? (
								<Link to={`/profile/${encodeURIComponent(listing.creator.id)}`}>
									{listing.creator.username}
								</Link>
							) : (
								listing.creator.username
							)
						)}
					</UserContext.Consumer>
					{listing.type === constants.tradingPost.listingTypes.buy ? (
						` is Looking For...`
					) : (
						` is Selling...`
					)}
				</div>

				<div className='Listing_offer'>
					{listing.items.length > 0 && (
						<div className='Listing_items'>
							Item(s):
							<ul>
								{listing.items.map(item =>
									<li key={item.id}>
										{item.name}, Qty: {item.quantity}
									</li>
								)}
							</ul>
						</div>
					)}

					{listing.bells > 0 && (
						<div className='Listing_bells'>
							Bells: {listing.bells.toLocaleString()}
						</div>
					)}

					{listing.residents.length > 0 && (
						<div className='Listing_villagers'>
							Villager(s):
							<ul>
								{listing.residents.map(resident =>
									<li key={resident.id}>
										{resident.name}
									</li>
								)}
							</ul>
						</div>
					)}

					{listing.comment && (
						<div className='Listing_additionalComments'>
							Additional Comment(s): {listing.comment}
						</div>
					)}
				</div>
				</>
			) : (
				<div className='Listing_create'>
					<UserContext.Consumer>
						{currentUser => (
							currentUser ? (
								<>
								User: <Link to={`/profile/${encodeURIComponent(listing.creator.id)}`}>
									{listing.creator.username}
								</Link>
								</>
							) : (
								<>
								User: {listing.creator.username}
								</>
							)
						)}
					</UserContext.Consumer>
				</div>
			)}

			<div className='Listing_lastActive'>
				Last Active: <StatusIndicator
					lastActiveTime={listing.creator.lastActiveTime}
					showDate={true}
				/>
			</div>

			<div className='Listing_lastUpdated'>
				Last Updated: {listing.formattedLastUpdated}
			</div>

			{listing.game ? (
				<div className='Listing_game'>
					Game: {listing.game.shortname}
				</div>
			) : (
				<RequireUser silent>
					<div className='Listing_location'>
						Location: {listing.bioLocation ? listing.bioLocation : 'Not Available'}
					</div>
				</RequireUser>
			)}

			<div className='Listing_status'>
				Listing Status: {listing.status}
			</div>

			<TotalRatings
				positiveRatingsTotal={listing.creator.positiveTradeRatingsTotal}
				neutralRatingsTotal={listing.creator.neutralTradeRatingsTotal}
				negativeRatingsTotal={listing.creator.negativeTradeRatingsTotal}
				type={constants.rating.types.trade}
			/>

			<div className='Listing_offers'>
				# of Offers: {listing.offers.total}
			</div>
		</div>
	);
}

type ListingProps = {
	listing: ListingType
};

export default Listing;
