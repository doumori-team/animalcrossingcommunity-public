import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Section, Header, Tabs } from '@layout';
import { constants } from '@utils';
import { Form, Text, Select } from '@form';

const ServicesPage = () =>
{
	const {shop, services, shopServices, acgames} = useLoaderData();

	const encodedId = encodeURIComponent(shop.id);

	const editService = (service) =>
	{
		return (
			<Form action='v1/shop/service/save' callback={`/shop/${encodedId}/services`} showButton>
				<input type='hidden' name='id' value={service ? service.id : 0} />
				<input type='hidden' name='shopId' value={shop.id} />

				<Form.Group>
					<Text
						name='name'
						required
						label='Service Name'
						maxLength={constants.max.shopServiceName}
						value={service ? service.name : ''}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='description'
						required
						label='Service Description'
						maxLength={constants.max.shopServiceDescription}
						value={service ? service.description : ''}
					/>
				</Form.Group>

				<Form.Group>
					<Select
						label='Game(s)'
						name='games'
						multiple
						options={acgames.filter(g => g.hasTown === true)}
						optionsMapping={{value: 'id', label: 'name'}}
						placeholder='Choose Animal Crossing game(s)...'
						size={5}
						required
						value={service ? service.games.map(g => g.id) : []}
					/>
				</Form.Group>
			</Form>
		);
	}

	const setActiveServices = () =>
	{
		return (
			<Section>
				{services.length > 0 ? (
					<Form action='v1/shop/services/save' callback={`/shop/${encodedId}/services`} showButton>
						<input type='hidden' name='shopId' value={shop.id} />

						<h2>Set Active Services:</h2>
						<Form.Group>
							<Select
								label='Service(s)'
								name='services'
								multiple
								value={shopServices}
								options={services}
								optionsMapping={{value: 'id', label: 'name'}}
								placeholder='Choose service(s)...'
							/>
						</Form.Group>
					</Form>
				) : (
					'No services found.'
				)}
			</Section>
		);
	}

	const editCustomServices = () =>
	{
		const defaultServices = services.filter(service => !service.default);

		if (defaultServices.length === 0)
		{
			return (
				<Section>
					No custom services found.
				</Section>
			);
		}

		return (
			defaultServices.map(service =>
				<Section key={service.id}>
					<h2>Edit Existing Service:</h2>
					{editService(service)}
				</Section>
			)
		);
	}

	return (
		<RequireUser ids={shop.owners.map(o => o.id)} permission='modify-shops'>
			<div className='ServicesPage'>
				<Header
					name={`${shop.name}: Services`}
					link={`/shop/${encodedId}`}
					links={
						<>
						<Link to={`/shop/${encodedId}/employees`}>
							Manage Employees & Roles
						</Link>
						<Link to={`/shop/${encodedId}/edit`}>
							Edit
						</Link>
						</>
					}
				/>

				<Tabs
					defaultActiveKey='active'
					fallback={
						<>
						{setActiveServices()}
						{editCustomServices()}
						<Section>
							<h2>Add New Service:</h2>
							{editService()}
						</Section>
						</>
					}
				>
					<Tabs.Tab eventKey='active' title='Active Services'>
						{setActiveServices()}
					</Tabs.Tab>
					<Tabs.Tab eventKey='edit' title='Edit Services'>
						{editCustomServices()}
					</Tabs.Tab>
					<Tabs.Tab eventKey='add' title='Add Service'>
						<Section>
							<h2>Add New Service:</h2>
							{editService()}
						</Section>
					</Tabs.Tab>
				</Tabs>
			</div>
		</RequireUser>
	);
}

export async function loadData({id})
{
	const [shop, acgames, shopServices, services] = await Promise.all([
		this.query('v1/shop', {id: id}),
		this.query('v1/acgames'),
		this.query('v1/shop/services', {id: id}),
		this.query('v1/shop/services', {id: id, inactive: true}),
	]);

	return {
		shop,
		acgames,
		shopServices,
		services,
	};
}

export default ServicesPage;
