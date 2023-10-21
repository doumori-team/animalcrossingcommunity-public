import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';

/*
 * Adoptee BT Settings
 */
export default async function settings()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'adoption-bt-settings'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const nodeId = constants.boardIds.adopteeBT;

	const users = await db.query(`
		SELECT
			user_account_cache.id,
			user_account_cache.username
		FROM user_node_permission
		JOIN user_account_cache ON (user_node_permission.user_id = user_account_cache.id)
		JOIN node_permission ON (user_node_permission.node_permission_id = node_permission.id)
		WHERE user_node_permission.node_id = $1::int AND node_permission.identifier = 'read'
	`, nodeId);

	return {
		users: users,
	};
}