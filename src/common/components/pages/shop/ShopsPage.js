import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser, RequirePermission } from '@behavior';
import Shop from '@/components/shop/Shop.js';
import { Form, Check, Select } from '@form';
import { Pagination, Header, Section, Search, Grid } from '@layout';
import { utils, constants } from '@utils';

const ShopsPage = () =>
{
	const {totalCount, shops, page, pageSize, acgames, shopServices, gameId,
		services, fee, vacation} = useLoaderData();

	const [selectedGameId, setSelectedGameId] = useState(gameId);
	const [selectedServices, setSelectedServices] = useState(gameId > 0 ? shopServices.filter(s => s.gameId === gameId) : []);

	const link = `&services=${encodeURIComponent(services.join(','))}
		&fee=${encodeURIComponent(fee)}
		&vacation=${encodeURIComponent(vacation)}
		&gameId=${encodeURIComponent(selectedGameId)}
	`;

	const changeGame = (event) =>
	{
		const gameId = Number(event.target.value);

		setSelectedGameId(isNaN(gameId) ? '' : gameId);
		setSelectedServices(gameId > 0 ? shopServices.filter(s => s.games.some(g => g.id === gameId)) : []);
	}

	return (
		<div className='ShopsPage'>
			<RequirePermission permission='view-shops'>
				<Header
					name='Shops'
					description="Looking for some help in your game? Order something from a shop! They'd be happy to assist."
					links={
						<>
						<RequireUser permission='modify-shops' silent>
							<Link to='/shops/add'>
								Create a Shop
							</Link>
						</RequireUser>
						<Link to='/shops/threads'>
							Orders, Applications & Other Threads
						</Link>
						<Link to='/shops?mine=true'>
							My Shops
						</Link>
						</>
					}
				/>

				<Search callback='/shops'>
					<Form.Group>
						<Select
							label='Game'
							name='gameId'
							value={selectedGameId}
							options={
								[
									{id: '', name: 'All Games'},
								]
									.concat(acgames
										.filter(g => g.hasTown === true))
							}
							optionsMapping={{value: 'id', label: 'name'}}
							placeholder='Choose an Animal Crossing game...'
							changeHandler={changeGame}
						/>
					</Form.Group>

					<Form.Group>
						<Check
							label='Fee'
							options={constants.boolOptions}
							name='fee'
							defaultValue={utils.realStringLength(fee) > 0 ?
								[fee] : ['both']}
						/>
					</Form.Group>

					<Form.Group>
						<Check
							label='Vacation'
							options={constants.boolOptions}
							name='vacation'
							defaultValue={utils.realStringLength(vacation) > 0 ?
								[vacation] : ['both']}
						/>
					</Form.Group>

					{selectedGameId > 0 && (
						<Form.Group>
							<Select
								label='Service(s)'
								name='services'
								multiple
								value={selectedServices.length > 0 ? selectedServices : []}
								options={shopServices}
								optionsMapping={{value: 'id', label: 'name'}}
								placeholder='Choose a service...'
							/>
						</Form.Group>
					)}
				</Search>

				<Section>
					<Grid name='shop' options={shops}>
						{shops.map((shop, index) =>
							<Shop key={index} shop={shop} />
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`shops`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(_, {page, services, fee, vacation, gameId, mine})
{
	const [acgames, shopServices, returnValue] = await Promise.all([
		this.query('v1/acgames'),
		this.query('v1/shop/services'),
		this.query('v1/shops', {
			page: page ? page : 1,
			services: services ? services: '',
			fee: fee ? fee : 'both',
			vacation: vacation ? vacation : 'both',
			gameId: gameId ? gameId : '',
			mine: mine ? mine : 'false',
		}),
	]);

	return {
		shops: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		acgames: acgames,
		shopServices: shopServices,
		services: returnValue.services,
		fee: returnValue.fee,
		vacation: returnValue.vacation,
		gameId: returnValue.gameId,
	};
}

export default ShopsPage;
