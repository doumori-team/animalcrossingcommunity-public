import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.tsx';
import { utils, constants, routerUtils } from '@utils';
import { APIThisType, GroupItemType, CatalogItemsType, UserCatalogCategoryType } from '@types';

export const action = routerUtils.formAction;

const EditUserCatalogPage = ({ loaderData }: { loaderData: EditUserCatalogPageProps }) =>
{
	const { catalogItems, catalog, by, category, userId, catalogCategories,
		name } = loaderData;

	return (
		<RequirePermission permission='modify-user-catalog'>
			<div className='EditUserCatalogPage'>
				<Catalog
					catalogItems={catalogItems}
					catalog={catalog}
					sortBy={by}
					userId={userId}
					selectedCategory={category}
					name={name}
					catalogCategories={catalogCategories}
					begLink={`/catalog/${encodeURIComponent(userId)}/${constants.town.catalogTypes.user}`}
					saveAction='v1/users/catalog/save'
				/>
			</div>
		</RequirePermission>
	);
};

async function loadData(this: APIThisType, { userId }: { userId: string }, { by, name, category }: { by?: string, name?: string, category?: string }): Promise<EditUserCatalogPageProps>
{
	const selectedUserId = Number(userId);

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';

	const [catalogCategories, catalogItems, catalog] = await Promise.all([
		this.query('v1/users/catalog/category', { id: selectedUserId }),
		this.query('v1/users/catalog', { id: selectedUserId }),
		this.query('v1/catalog', { categoryName: category, sortBy: by, name: name }),
	]);

	return { catalog, by, category, userId: selectedUserId, catalogItems, catalogCategories, name };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditUserCatalogPageProps = {
	catalog: GroupItemType[]
	by: string
	category: string
	userId: number
	catalogItems: CatalogItemsType[]
	catalogCategories: UserCatalogCategoryType
	name: string
};

export default EditUserCatalogPage;
