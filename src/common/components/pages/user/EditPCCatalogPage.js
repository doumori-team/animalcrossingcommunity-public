import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.js';
import { utils, constants } from '@utils';

const EditPCCatalogPage = () =>
{
	const {catalogItems, catalog, by, category, userId, catalogCategories, name} = useLoaderData();

	return (
		<RequirePermission permission='modify-user-catalog'>
			<div className='EditPCCatalogPage'>
				<Catalog
					catalogItems={catalogItems}
					catalog={catalog}
					sortBy={by}
					userId={userId}
					selectedCategory={category}
					name={name}
					catalogCategories={catalogCategories}
					begLink={`/catalog/${encodeURIComponent(userId)}/${constants.town.catalogTypes.pc}`}
					saveAction='v1/users/catalog/pc/save'
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
		this.query('v1/users/catalog/pc/category', {id: userId}),
		this.query('v1/users/catalog/pc', {id: userId}),
		this.query('v1/acgame/catalog', {id: constants.gameIds.ACPC, categoryName: category, sortBy: by, name: name}),
	]);

	return {catalog, by, category, userId, catalogItems, catalogCategories, name};
}

export default EditPCCatalogPage;
