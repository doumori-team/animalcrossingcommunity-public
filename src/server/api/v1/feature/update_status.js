import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function update_status({id, newStatus})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [basicPermission, leadPermission, feature, [status]] = await Promise.all([
		this.query('v1/permission', {permission: 'claim-features'}),
		this.query('v1/permission', {permission: 'manage-features'}),
		this.query('v1/feature', {id: id}),
		db.query(`
			SELECT
				feature_status.id
			FROM feature_status
			WHERE feature_status.id = $1::citext
		`, newStatus),
	]);

	if (!status)
	{
		throw new UserError('no-such-feature-status');
	}

	if (!basicPermission)
	{
		throw new UserError('permission');
	}

	const currStatus = feature.statusId;

	// Normal Staff can only move from certain statuses
	if (!leadPermission && !(currStatus === constants.featureStatuses.suggestion || currStatus === constants.featureStatuses.workList))
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE feature
		SET status_id = $1::citext
		WHERE id = $2::int
	`, newStatus, id);
}

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
}

export default update_status;