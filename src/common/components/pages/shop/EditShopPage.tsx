import { use } from 'react';
import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import EditShop from '@/components/shop/EditShop.tsx';
import { Section, Header } from '@layout';
import { APIThisType, ShopType, ACGameType, ShopCatalogType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditShopPage = ({ loaderData }: { loaderData: Promise<EditShopPageProps> }) =>
{
	const { shop, acgames, acGameCatalogs } = getData(use(loaderData));

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
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<any>
{
	return Promise.all([
		this.query('v1/shop', { id: id }),
		this.query('v1/acgames'),
		this.query('v1/shop/catalog', { id: id }),
	]);
}

function getData(data: any): EditShopPageProps
{
	const [shop, acgames, acGameCatalogs] = data;

	return { shop, acgames, acGameCatalogs };
}

export const loader = routerUtils.deferLoader(loadData);

type EditShopPageProps = {
	shop: ShopType
	acgames: ACGameType[]
	acGameCatalogs: ShopCatalogType[]
};

export default routerUtils.LoadingFunction(EditShopPage);
