import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import StatusIndicator from '@/components/nodes/StatusIndicator.js';
import { constants } from '@utils';
import { listingShape, offerShape } from '@propTypes';
import TotalRatings from '@/components/ratings/TotalRatings.js';
import { Confirm } from '@form';
import { ReportProblem } from '@layout';
import { UserContext } from '@contexts';

const Offer = ({offer, listing}) =>
{
	const encodedId = encodeURIComponent(listing.id);

	return (
		<div className='Offer'>
			<div className='Offer_links'>
				<RequireUser id={listing.creator.id} silent>
					{([
						constants.tradingPost.listingStatuses.open,
						constants.tradingPost.listingStatuses.offerAccepted
					].includes(listing.status) &&
						![
							constants.tradingPost.offerStatuses.rejected,
							constants.tradingPost.offerStatuses.cancelled
						].includes(offer.status)) && (
						<>
							{!listing.offers.accepted && (
								<Confirm
									action='v1/trading_post/listing/offer/accept'
									callback={`/trading-post/${encodedId}`}
									id={offer.id}
									label='Accept'
									message='Are you sure you want to accept this offer?'
								/>
							)}
							{(!listing.offers.accepted ||
								(listing.offers.accepted.id === offer.id)) && (
								<Confirm
									action='v1/trading_post/listing/offer/reject'
									callback={`/trading-post/${encodedId}`}
									id={offer.id}
									label='Reject'
									message='Are you sure you want to reject this offer?'
								/>
							)}
						</>
					)}
				</RequireUser>
				<RequireUser id={offer.user.id} silent>
					{([
						constants.tradingPost.listingStatuses.open,
						constants.tradingPost.listingStatuses.offerAccepted
					].includes(listing.status) &&
						![
							constants.tradingPost.offerStatuses.rejected,
							constants.tradingPost.offerStatuses.cancelled
						].includes(offer.status)) && (
						<Confirm
							action='v1/trading_post/listing/offer/cancel'
							callback={`/trading-post/${encodedId}`}
							id={offer.id}
							label='Cancel'
							message='Are you sure you want to cancel this offer?'
						/>
					)}
				</RequireUser>
			</div>

			<h1 className='Offer_name'>
				<ReportProblem type={constants.userTicket.types.offer} id={offer.id} />
				Offer #{offer.sequence}
			</h1>

			{(offer.items.length > 0 || offer.bells > 0 || offer.residents.length > 0 || offer.comment) ? (
				<>
				<div className='Offer_offered'>
					<UserContext.Consumer>
						{currentUser => (
							currentUser ? (
								<Link to={`/profile/${encodeURIComponent(offer.user.id)}`}>
									{offer.user.username}
								</Link>
							) : (
								offer.user.username
							)
						)}
					</UserContext.Consumer>
					{listing.type === constants.tradingPost.listingTypes.buy ? (
						` wants...`
					) : (
						` will trade...`
					)}
				</div>

				<div className='Offer_offer'>
					{offer.items.length > 0 && (
						<div className='Offer_items'>
							Item(s):
							<ul>
								{offer.items.map(item =>
									<li key={item.id}>
										{item.name}, Qty: {item.quantity}
									</li>
								)}
							</ul>
						</div>
					)}

					{offer.bells > 0 && (
						<div className='Offer_bells'>
							Bells: {offer.bells.toLocaleString()}
						</div>
					)}

					{offer.residents.length > 0 && (
						<div className='Offer_villagers'>
							Villager(s):
							<ul>
								{offer.residents.map(resident =>
									<li key={resident.id}>
										{resident.name}
									</li>
								)}
							</ul>
						</div>
					)}

					{offer.comment && (
						<div className='Offer_additionalComments'>
							Additional Comment(s): {offer.comment}
						</div>
					)}
				</div>
				</>
			) : (
				<div className='Offer_offered'>
					<UserContext.Consumer>
						{currentUser => (
							currentUser ? (
								<>
								User: <Link to={`/profile/${encodeURIComponent(offer.user.id)}`}>
									{offer.user.username}
								</Link>
								</>
							) : (
								<>
								User: {offer.user.username}
								</>
							)
						)}
					</UserContext.Consumer>
				</div>
			)}

			{!listing.game && (
				<RequireUser silent>
					<div className='Offer_location'>
						Location: {offer.bioLocation ? offer.bioLocation : 'Not available'}
					</div>
				</RequireUser>
			)}

			<div className='Offer_lastActive'>
				Last Active: <StatusIndicator
					lastActiveTime={offer.user.lastActiveTime}
					showDate={true}
				/>
			</div>

			<TotalRatings
				positiveRatingsTotal={offer.user.positiveTradeRatingsTotal}
				neutralRatingsTotal={offer.user.neutralTradeRatingsTotal}
				negativeRatingsTotal={offer.user.negativeTradeRatingsTotal}
				type={constants.rating.types.trade}
			/>

			<div className='Offer_status'>
				Status: {offer.status}
			</div>
		</div>
	);
}

Offer.propTypes = {
	offer: offerShape,
	listing: listingShape,
};

export default Offer;
