import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.js';
import { utils, constants } from '@utils';

const EditUserCatalogPage = () =>
{
	const {catalogItems, catalog, by, category, userId, catalogCategories, name} = useLoaderData();

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
}

export async function loadData({userId}, {by, name, category})
{
	userId = Number(userId);

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';

	const [catalogCategories, catalogItems, catalog] = await Promise.all([
		this.query('v1/users/catalog/category', {id: userId}),
		this.query('v1/users/catalog', {id: userId}),
		this.query('v1/catalog', {categoryName: category, sortBy: by, name: name}),
	]);

	return {catalog, by, category, userId, catalogItems, catalogCategories, name};
}

export default EditUserCatalogPage;
