import { ACCCache } from '@cache';
import { APIThisType } from '@types';

async function all(this: APIThisType): Promise<void>
{
	console.info('Regnerate Cache - All: Flushing');

	await ACCCache.flush();

	console.info('Regenerate Cache - All: Finished');
}

all.permissions = [
	'admin-pages',
];

export default all;
