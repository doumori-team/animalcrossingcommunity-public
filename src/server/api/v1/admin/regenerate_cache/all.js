import { UserError } from '@errors';
import { ACCCache } from '@cache';

export default async function all()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'admin-pages'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	console.log('Regnerate Cache - All: Flushing');

	await ACCCache.flush();

	console.log('Regenerate Cache - All: Finished');
}