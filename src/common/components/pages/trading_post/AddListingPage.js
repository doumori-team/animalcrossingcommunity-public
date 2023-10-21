import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditListing from '@/components/trading_post/EditListing.js';
import { utils, constants } from '@utils';
import { UserError } from '@errors';
import { UserContext } from '@contexts';
import { Header, Section, ACGameButtons } from '@layout';

const AddListingPage = () =>
{
	const {acgames, selectedGameId, acgameCatalog, residents, selectedType,
		acItemsCatalog} = useLoaderData();

	return (
		<div className='AddListingPage'>
			<RequireUser permission='use-trading-post'>
				<Header
					name='Create a Listing'
					links={
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
					}
				/>

				<Section>
					<h3>What type of trade is it?</h3>

					<div className='AddListingPage_links'>
						<Link
							to='/trading-post/add/game'
							className='AddListingPage_game'
							aria-label='In-game'
							preventScrollReset={true}
						>
							<p>In-game</p>
						</Link>
						<Link
							to='/trading-post/add/real'
							className='AddListingPage_cards'
							aria-label='Cards'
							preventScrollReset={true}
						>
							<p>Cards</p>
						</Link>
					</div>
				</Section>

				{selectedType === constants.tradingPost.tradeTypes.game && (
					<Section>
						<h3>What game is this for?</h3>

						<ACGameButtons
							acgames={acgames.filter(g => g.hasTown === true)}
							link='/trading-post/add/game'
							reloadDocument
						/>
					</Section>
				)}

				{(selectedGameId > 0 || selectedType === constants.tradingPost.tradeTypes.real) && (
					<Section>
						<EditListing
							key={selectedGameId}
							gameId={selectedGameId}
							acgameCatalog={acgameCatalog}
							residents={residents}
							type={selectedType}
							acItemsCatalog={acItemsCatalog}
						/>
					</Section>
				)}
			</RequireUser>
		</div>
	);
}

export async function loadData({type, gameId})
{
	const selectedGameId = Number(gameId || 0);
	const selectedType = String(type || '');

	if (utils.realStringLength(selectedType) > 0 && ![constants.tradingPost.tradeTypes.real, constants.tradingPost.tradeTypes.game].includes(selectedType))
	{
		throw new UserError('bad-format');
	}

	const [acgames, acgameCatalog, residents, acItemsCatalog] = await Promise.all([
		selectedType === constants.tradingPost.tradeTypes.game ? this.query('v1/acgames') : null,
		selectedGameId > 0 ? this.query('v1/acgame/catalog', {id: selectedGameId, categoryName: 'all', sortBy: 'items'}) : null,
		selectedGameId > 0 ? this.query('v1/acgame/resident', {id: selectedGameId}) : null,
		selectedType === constants.tradingPost.tradeTypes.real ? this.query('v1/catalog', {categoryName: 'all', sortBy: 'items'}) : null,
	]);

	return {acgames, selectedGameId, acgameCatalog, residents, selectedType, acItemsCatalog};
}

export default AddListingPage;
