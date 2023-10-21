import React from 'react';
import { useAsyncValue, useParams, useLocation } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import Catalog from '@/components/users/Catalog.js';
import { utils, constants } from '@utils';

const UserCatalogPage = () =>
{
	const {catalogItems, catalog, catalogCategories} = getData(useAsyncValue());
	let {userId} = useParams();
	const query = new URLSearchParams(useLocation().search);

	let by = query.get('by');
	let name = query.get('name');
	let category = query.get('category');

	by = by ? by : 'theme';
	name = name ? name : '';
	category = category ? utils.convertForUrl(category) : '';
	userId = Number(userId);

	return (
		<RequirePermission permission='view-user-catalog'>
			<div className='UserCatalogPage'>
				<Catalog
					catalogItems={catalogItems}
					catalog={catalog}
					sortBy={by}
					userId={userId}
					selectedCategory={category}
					name={name}
					catalogCategories={catalogCategories}
					begLink={`/catalog/${encodeURIComponent(userId)}/${constants.town.catalogTypes.user}`}
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

	return Promise.all([
		this.query('v1/users/catalog/category', {id: userId}),
		utils.realStringLength(category) > 0 ? this.query('v1/users/catalog', {id: userId}) : null,
		utils.realStringLength(category) > 0 ? this.query('v1/catalog', {categoryName: category, sortBy: by, name: name}) : null,
	]);
}

function getData(data)
{
	const [catalogCategories, catalogItems, catalog] = data;

	return {catalog, catalogItems, catalogCategories};
}

export default UserCatalogPage;
