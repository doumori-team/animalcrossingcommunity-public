import { getBellShopCategories } from '@/catalog/info.js';
import { UserError } from '@errors';

export default async function categories()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return getBellShopCategories();
}