import { sortedBellShopItems } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function items({page, categoryId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let results = [], count = 0;

	const items = sortedBellShopItems[categoryId];

	if (items)
	{
		results = items.slice(offset, offset+pageSize);

		count = Number(items.length);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
	};
}

items.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	categoryId: {
		type: APITypes.number,
		default: 0,
	},
}

export default items;