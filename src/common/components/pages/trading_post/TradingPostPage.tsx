import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser, RequirePermission, RequireClientJS } from '@behavior';
import { Form, Check, Select, Text, Switch } from '@form';
import Listing from '@/components/trading_post/Listing.tsx';
import { UserContext } from '@contexts';
import { Pagination, Header, Section, Grid, Search } from '@layout';
import { utils, constants } from '@utils';
import * as iso from 'common/iso.js';
import { APIThisType, ACGameType, ListingsType, ACGameItemType, ResidentsType, ElementSelectType } from '@types';

const TradingPostPage = () =>
{
	const { listings, totalCount, page, pageSize, acgames, creator, type,
		bells, items, villagers, active, acItemsCatalog, wishlist,
		bioLocation, comment, gameId, acgameCatalog, initialResidents } = useLoaderData() as TradingPostPageProps;

	const [selectedGameId, setSelectedGameId] = useState<number | null>(gameId);
	const [residents, setResidents] = useState<ResidentsType[number] | null>(initialResidents && gameId ? initialResidents[gameId] : null);

	const link = `&creator=${encodeURIComponent(creator)}
		&type=${encodeURIComponent(type)}
		&gameId=${encodeURIComponent(String(selectedGameId || ''))}
		&bells=${encodeURIComponent(String(bells || ''))}
		&items=${encodeURIComponent(items.join(','))}
		&villagers=${encodeURIComponent(villagers.join(','))}
		&active=${encodeURIComponent(String(active || ''))}
		&wishlist=${encodeURIComponent(wishlist)}
		&bioLocation=${encodeURIComponent(bioLocation)}
		&comment=${encodeURIComponent(comment)}
	`;

	const changeGame = (event: ElementSelectType): void =>
	{
		const gameId = Number(event.target.value);

		setSelectedGameId(isNaN(gameId) ? null : Number(event.target.value));
		setResidents(initialResidents && gameId ? initialResidents[gameId] : null);
	};

	const handleItemsLookup = async (query: string): Promise<ACGameItemType[number]['all']['items']> =>
	{
		let callback = 'v1/acgame/catalog';

		let params = new FormData();
		params.append('query', query);
		params.append('categoryName', 'all');
		params.append('sortBy', 'items');

		if (selectedGameId === 0)
		{
			callback = 'v1/catalog';
		}
		else
		{
			params.append('id', String(selectedGameId || ''));
		}

		return (iso as any).query(null, callback, params)
			.then(async (items: ACGameItemType[number]['all']['items']) =>
			{
				if (selectedGameId === 0)
				{
					return items;
				}

				return items.filter(item => item.tradeable);
			})
			.catch((error: any) =>
			{
				console.error('Error attempting to get items.');
				console.error(error);

				return [];
			});
	};

	return (
		<div className='TradingPostPage'>
			<RequirePermission permission='use-trading-post'>
				<Header
					name='Trading Post'
					description={`The Trading Post is here for all your selling and buying needs. You can view the listings and condense your search by using the search options below. By clicking "Make an Offer" on a listing, you can offer up anything from bells or items to villagers. Once you're ready to list an item, click "Create a Listing". From here you can choose what it is you're either looking for or selling. You can at any time view your open trades and offers by clicking "My Trades". Once you have completed a trade, you can leave a rating and view those ratings by clicking "My Trade Ratings".`}
					links={
						<RequireUser silent>
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
						</RequireUser>
					}
				/>

				<Search callback='/trading-post'>
					<Form.Group>
						<Text
							name='creator'
							label='Creator'
							value={creator}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>

					<Form.Group>
						<Check
							options={constants.tradingPost.listingTypesArray}
							name='type'
							defaultValue={utils.realStringLength(type) > 0 ?
								[type] : ['Both']}
							label='Type'
						/>
					</Form.Group>

					<Form.Group>
						<Text
							type='number'
							name='active'
							label='Active in Last X Days'
							value={active ? active : '7'}
							min={0}
							max={constants.max.active}
						/>
					</Form.Group>

					<Form.Group>
						<Select
							name='gameId'
							label='Game'
							value={selectedGameId}
							changeHandler={changeGame}
							options={
								([
									{ id: '', name: 'All Games' },
									{ id: '0', name: 'None' },
								] as any)
									.concat(acgames
										.filter(g => g.hasTown === true))
							}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>

					{!!selectedGameId &&
						<RequireClientJS>
							<Form.Group>
								<Select
									name='items'
									label='Item(s)'
									options={acItemsCatalog.length > 0 ? selectedGameId === 0 ? acItemsCatalog : acgameCatalog.filter(item => item.tradeable) : []}
									optionsMapping={{ value: 'id', label: 'name' }}
									value={items}
									placeholder='Select item(s)...'
									async
									multiple
									groupBy='categoryName'
									size={15}
									loadOptionsHandler={handleItemsLookup}
								/>
							</Form.Group>
						</RequireClientJS>
					}

					{selectedGameId && selectedGameId > constants.gameIds.ACGC && residents != null &&
						<>
							<Form.Group>
								<Select
									name='villagers'
									label='Villager(s)'
									multiple
									placeholder='Select villager(s)...'
									options={residents.filter((r: any) => r.isTown === true)}
									optionsMapping={{ value: 'id', label: 'name' }}
									value={villagers}
									size={15}
								/>
							</Form.Group>

							<Form.Group>
								<Text
									name='bells'
									type='number'
									label='Bells'
									value={bells}
									max={constants.max.number}
								/>
							</Form.Group>

							<Form.Group>
								<Text
									name='comment'
									label='Additional Info'
									value={comment}
									maxLength={constants.max.additionalInfo}
								/>
							</Form.Group>
						</>
					}

					{selectedGameId === 0 &&
						<Form.Group>
							<Text
								name='bioLocation'
								label='Location'
								value={bioLocation}
								maxLength={constants.max.location}
							/>
						</Form.Group>
					}

					{!!selectedGameId &&
						<Form.Group>
							<Switch
								name='wishlist'
								label='Any Wishlist Item'
								value={wishlist}
							/>
						</Form.Group>
					}
				</Search>

				<Section>
					<Grid name='listing' options={listings}>
						{listings.map((listing, index) =>
							<Listing key={index} listing={listing} />,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`trading-post`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, _: any, { page, creator, type, gameId, bells, items, villagers, active, wishlist, bioLocation, comment }: { page?: string, creator?: string, type?: string, gameId?: string, bells?: string, items?: string, villagers?: string, active?: string, wishlist?: string, bioLocation?: string, comment?: string }): Promise<TradingPostPageProps>
{
	const [acgames, returnValue, acgameCatalog, residents, acItemsCatalog] = await Promise.all([
		this.query('v1/acgames'),
		this.query('v1/trading_post/listings', {
			page: page ? page : 1,
			creator: creator ? creator : '',
			type: type ? type : constants.tradingPost.listingTypes.both,
			gameId: gameId ? gameId : '',
			bells: bells ? bells : '',
			items: items ? items : '',
			villagers: villagers ? villagers : '',
			active: active ? active : '',
			wishlist: wishlist ? wishlist : 'false',
			bioLocation: bioLocation ? bioLocation : '',
			comment: comment ? comment : '',
		}),
		items && gameId != '0' ? this.query('v1/acgame/catalog', { id: gameId, categoryName: 'all', sortBy: 'items' }) : [],
		this.query('v1/acgame/resident'),
		items ? this.query('v1/catalog', { categoryName: 'all', sortBy: 'items' }) : [],
	]);

	return {
		listings: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		acgames: acgames,
		creator: returnValue.creator,
		type: returnValue.type,
		gameId: returnValue.gameId,
		bells: returnValue.bells,
		acgameCatalog: acgameCatalog,
		initialResidents: residents,
		items: returnValue.items,
		villagers: returnValue.villagers,
		active: returnValue.active,
		acItemsCatalog: acItemsCatalog,
		wishlist: returnValue.wishlist,
		bioLocation: returnValue.bioLocation,
		comment: returnValue.comment,
	};
}

type TradingPostPageProps = {
	listings: ListingsType['results']
	totalCount: ListingsType['count']
	page: ListingsType['page']
	pageSize: ListingsType['pageSize']
	acgames: ACGameType[]
	creator: ListingsType['creator']
	type: ListingsType['type']
	gameId: ListingsType['gameId']
	bells: ListingsType['bells']
	acgameCatalog: ACGameItemType[number]['all']['items']
	initialResidents: ResidentsType
	items: ListingsType['items']
	villagers: ListingsType['villagers']
	active: ListingsType['active']
	acItemsCatalog: ACGameItemType[number]['all']['items']
	wishlist: ListingsType['wishlist']
	bioLocation: ListingsType['bioLocation']
	comment: ListingsType['comment']
};

export default TradingPostPage;
