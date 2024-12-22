import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, FeatureType } from '@types';

async function claim(this: APIThisType, { id }: claimProps): Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const feature: FeatureType = await this.query('v1/feature', { id: id });

	const currStatus = feature.statusId;

	if (currStatus !== constants.featureStatuses.workList && currStatus !== constants.featureStatuses.inProgress)
	{
		throw new UserError('bad-format');
	}

	if (currStatus === constants.featureStatuses.workList)
	{
		await this.query('v1/feature/update_status', { id: id, newStatus: constants.featureStatuses.inProgress });
	}
	else
	{
		const permission: boolean = await this.query('v1/permission', { permission: 'claim-features' });

		if (!permission)
		{
			throw new UserError('permission');
		}
	}

	if (feature.claimed)
	{
		throw new UserError('already-claimed');
	}

	await db.query(`
		INSERT INTO feature_assigned_user (user_id, feature_id)
		VALUES ($1, $2)
	`, this.userId, id);
}

claim.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type claimProps = {
	id: number
};

export default claim;
