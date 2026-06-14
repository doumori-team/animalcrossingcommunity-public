import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, FeatureType } from '@types';

async function update_status(this: APIThisType, { id, newStatus }: updateStatusProps): Promise<void>
{
	const [leadPermission, feature, [status]]: [boolean, FeatureType, [{ id: number } | undefined]] = await Promise.all([
		this.query('v1/permission', { permission: 'manage-features' }),
		this.query('v1/feature', { id: id }),
		db.query(`
			SELECT
				feature_status.id
			FROM feature_status
			WHERE feature_status.id = $1
		`, newStatus),
	]);

	if (!status)
	{
		throw new UserError('no-such-feature-status');
	}

	const currStatus = feature.statusId;

	// Normal Staff can only move from certain statuses
	if (!leadPermission && !(currStatus === constants.featureStatuses.suggestion || currStatus === constants.featureStatuses.workList))
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE feature
		SET status_id = $1
		WHERE id = $2::int
	`, newStatus, id);
}

update_status.permissions = [
	'claim-features',
	'userId',
];

update_status.apiTypes = {
	id: {
		type: APITypes.number,
		default: true,
	},
	newStatus: {
		type: APITypes.string,
		default: '',
		required: true,
	},
};

type updateStatusProps = {
	id: number
	newStatus: string
};

export default update_status;
