import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, PWPsType } from '@types';

async function pwp(this: APIThisType, { id }: pwpProps): Promise<PWPsType[number]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return (await ACCCache.get(constants.cacheKeys.pwps))[id];
}

pwp.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type pwpProps = {
	id: number
};

export default pwp;
