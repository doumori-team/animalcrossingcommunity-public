import React from 'react';
import { Link, useAsyncValue } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditShop from '@/components/shop/EditShop.tsx';
import { Section, Header } from '@layout';
import { APIThisType, ShopType, ACGameType, ShopCatalogType } from '@types';

const EditShopPage = () =>
{
	const {shop, acgames, acGameCatalogs} = getData(useAsyncValue()) as EditShopPageProps;

	const encodedId = encodeURIComponent(shop.id);

	return (
		<RequireUser ids={shop.owners.map(o => o.id)} permission='modify-shops'>
			<div className='EditTownPage'>
				<Header
					name={shop.name}
					link={`/shop/${encodedId}`}
					links={
						<>
						<Link to={`/shop/${encodedId}/employees`}>
							Manage Employees & Roles
						</Link>
						<Link to={`/shop/${encodedId}/services`}>
							Manage Services
						</Link>
						</>
					}
				/>

				<Section>
					<EditShop
						key={shop.id}
						shop={shop}
						acgames={acgames}
						catalogItems={acGameCatalogs}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<any>
{
	return Promise.all([
		this.query('v1/shop', {id: id}),
		this.query('v1/acgames'),
		this.query('v1/shop/catalog', {id: id}),
	]);
}

function getData(data:any) : EditShopPageProps
{
	const [shop, acgames, acGameCatalogs] = data;

	return {shop, acgames, acGameCatalogs};
}

type EditShopPageProps = {
	shop: ShopType
	acgames: ACGameType[]
	acGameCatalogs: ShopCatalogType[]
}

export default EditShopPage;
