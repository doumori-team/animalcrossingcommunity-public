import { UserError } from '@errors';
import { ACCCache } from '@cache';
import { APIThisType } from '@types';

export default async function all(this: APIThisType): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'admin-pages' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	console.info('Regnerate Cache - All: Flushing');

	await ACCCache.flush();

	console.info('Regenerate Cache - All: Finished');
}
