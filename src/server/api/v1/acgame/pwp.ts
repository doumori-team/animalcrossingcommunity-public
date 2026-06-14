import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, PWPsType } from '@types';

async function pwp(this: APIThisType, { id }: pwpProps): Promise<PWPsType[number]>
{
	return (await ACCCache.get(constants.cacheKeys.pwps))[id];
}

pwp.permissions = [
	'modify-towns',
];

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
