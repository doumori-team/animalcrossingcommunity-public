import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser, RequireClientJS } from '@behavior';
import { Form, Select, Text } from '@form';
import { UserContext } from '@contexts';
import { constants } from '@utils';
import { ErrorMessage, Header, Section } from '@layout';
import Listing from '@/components/trading_post/Listing.js';

const AddOfferPage = () =>
{
	const {listing, residents, catalogItems} = useLoaderData();

	const [items, setItems] = useState([]);
	const [quantities, setQuantities] = useState([]);

	const encodedId = encodeURIComponent(listing.id);

	const changeItems = (newItems) =>
	{
		// map old quantities to new quantity indexes
		let newQuantities = [];

		newItems.map((itemId, index) => {
			let itemIndex = items.findIndex(id => id === itemId);

			if (itemIndex >= 0)
			{
				newQuantities[index] = quantities[itemIndex];
			}
			else
			{
				newQuantities[index] = 1;
			}
		});

		setItems(newItems);
		setQuantities(newQuantities);
	}

	const changeQuantity = (index, event) =>
	{
		let newQuantities = [...quantities];
		newQuantities[index] = Number(event.target.value);

		setQuantities(newQuantities);
	}

	return (
		<div className='AddOfferPage'>
			<RequireUser permission='use-trading-post'>
				<UserContext.Consumer>
					{currentUser => currentUser && (
						<>
						<Header
							name={`Offer for Listing #${listing.id}`}
							link={`/trading-post/${encodedId}`}
							links={
								<>
								<Link to={`/trading-post/add`}>
									Create a Listing
								</Link>
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
						/>

						<Section>
							{listing.type === constants.tradingPost.listingTypes.buy ? (
								<h3>{listing.creator.username} is Looking For...</h3>
							) : (
								<h3>{listing.creator.username} is Selling...</h3>
							)}

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
						</Section>

						<Section>
							{listing.type === constants.tradingPost.listingTypes.buy ? (
								<h3>I Want...</h3>
							) : (
								<h3>I'll Trade...</h3>
							)}

							{currentUser.id !== listing.creator.id ? (
								listing.status === constants.tradingPost.listingStatuses.open &&
									(!listing.offers.list.find(x => x.user.id === currentUser.id) ||
									listing.offers.list.find(x => x.user.id === currentUser.id)?.status === constants.tradingPost.offerStatuses.cancelled) ? (
									<Form
										action='v1/trading_post/listing/offer/save'
										callback={`/trading-post/${encodedId}`}
										showButton
									>
										<input type='hidden' name='id'
											value={listing ? listing.id : 0} />

										<RequireClientJS fallback={
											<ErrorMessage identifier='javascript-required' />
										}>
											<Form.Group>
												<Select
													name='items'
													label='Item(s)'
													multiple
													async
													options={catalogItems}
													optionsMapping={{value: 'id', label: 'name'}}
													value={items}
													placeholder='Select item(s)...'
													changeHandler={changeItems}
													required={!listing.game || listing.game.id === constants.gameIds.ACGC}
													groupBy='categoryName'
													size={15}
												/>
											</Form.Group>

											{((!listing.game || listing.game.id > constants.gameIds.ACGC) && items.length > 0) && (
												<div className='AddOfferPage_option'>
													{items.map((itemId, index) =>
														<Form.Group key={index}>
															<Text
																type='number'
																label={`${catalogItems.find(item => item.id === itemId).name} Quantity`}
																name='quantities'
																value={quantities[index]}
																changeHandler={(e) => changeQuantity(index, e)}
																required
																max={constants.max.number}
																min={constants.min.number}
															/>
														</Form.Group>
													)}
												</div>
											)}
										</RequireClientJS>

										{(listing.game && listing.game.id > constants.gameIds.ACGC) && (
											<>
												<Form.Group>
													<Text
														name='bells'
														type='number'
														label='Bells'
														max={constants.max.number}
													/>
												</Form.Group>

												<Form.Group>
													<Select
														name='residents'
														label='Villager(s)'
														multiple
														placeholder='Select villager(s)...'
														options={residents.filter(r => r.isTown === true)}
														optionsMapping={{value: 'id', label: 'name'}}
														size={15}
													/>
												</Form.Group>

												<Form.Group>
													<Text
														name='comment'
														label='Additional Info'
														maxLength={constants.max.additionalInfo}
													/>
												</Form.Group>
											</>
										)}
									</Form>
								) : (
									'You cannot make an offer on this listing at this time.'
								)
							) : (
								'Listing creator cannot make an offer on their own listing.'
							)}
						</Section>
						</>
					)}
				</UserContext.Consumer>
			</RequireUser>
		</div>
	);
}

export async function loadData({id})
{
	const [listing] = await Promise.all([
		this.query('v1/trading_post/listing', {id: id}),
	]);

	const [acgameCatalog, residents, acItemsCatalog] = await Promise.all([
		listing.game ? this.query('v1/acgame/catalog', {id: listing.game.id, categoryName: 'all', sortBy: 'items'}) : null,
		listing.game && listing.game.id > constants.gameIds.ACGC ? this.query('v1/acgame/resident', {id: listing.game.id}) : null,
		!listing.game ? this.query('v1/catalog', {categoryName: 'all', sortBy: 'items'}) : null,
	]);

	const catalogItems = listing.game ?
		acgameCatalog.filter(item => item.tradeable) :
		acItemsCatalog;

	return {listing, residents, catalogItems};
}

export default AddOfferPage;
