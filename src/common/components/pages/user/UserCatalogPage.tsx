import { use } from 'react';
import { useLocation, Params } from 'react-router';

import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.tsx';
import { utils, constants, routerUtils } from '@utils';
import { LocationType, GroupItemType, APIThisType, CatalogItemsType, UserCatalogCategoryType } from '@types';

export const action = routerUtils.formAction;

const UserCatalogPage = ({ loaderData, params }: { loaderData: Promise<UserCatalogPageProps>, params: Params }) =>
{
	const { catalogItems, catalog, catalogCategories } = getData(use(loaderData));
	let { userId } = params;
	const query = new URLSearchParams((useLocation() as LocationType).search);

	let by = query.get('by');
	let name = query.get('name');
	let category = query.get('category');

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';
	const selectedUserId = Number(userId);

	return (
		<RequirePermission permission='view-user-catalog'>
			<div className='UserCatalogPage'>
				<Catalog
					catalogItems={catalogItems}
					catalog={catalog}
					sortBy={by}
					userId={selectedUserId}
					selectedCategory={category}
					name={name}
					catalogCategories={catalogCategories}
					begLink={`/catalog/${encodeURIComponent(selectedUserId)}/${constants.town.catalogTypes.user}`}
				/>
			</div>
		</RequirePermission>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { by, name, category }: { by?: string, name?: string, category?: string }): Promise<any>
{
	const selectedUserId = Number(userId);

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';

	return Promise.all([
		this.query('v1/users/catalog/category', { id: selectedUserId }),
		utils.realStringLength(category) > 0 ? this.query('v1/users/catalog', { id: selectedUserId }) : null,
		utils.realStringLength(category) > 0 ? this.query('v1/catalog', { categoryName: category, sortBy: by, name: name }) : null,
	]);
}

function getData(data: any): UserCatalogPageProps
{
	const [catalogCategories, catalogItems, catalog] = data;

	return { catalog, catalogItems, catalogCategories };
}

export const loader = routerUtils.deferLoader(loadData);

type UserCatalogPageProps = {
	catalog: GroupItemType[]
	catalogItems: CatalogItemsType[]
	catalogCategories: UserCatalogCategoryType
};

export default routerUtils.LoadingFunction(UserCatalogPage);
