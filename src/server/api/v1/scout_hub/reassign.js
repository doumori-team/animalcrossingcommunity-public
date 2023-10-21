import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Reassign which scout is set for user.
 */
async function reassign({adopteeId, scoutId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'adoption-reassign'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	await this.query('v1/scout_hub/adopt', {adopteeId: adopteeId, scoutId: scoutId});
}

reassign.apiTypes = {
	adopteeId: {
		type: APITypes.userId,
		required: true,
	},
	scoutId: {
		type: APITypes.userId,
		nullable: true,
	},
}

export default reassign;