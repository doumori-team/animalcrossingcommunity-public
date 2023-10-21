import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

/*
 * Save settings for adoption buddy thread.
 */
async function save({username, action})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'adoption-bt-settings'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	const user = await this.query('v1/user_lite', {username: username});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Update permissions
	const nodeId = constants.boardIds.adopteeBT;

	const alreadyHavePermission = await this.query('v1/node/permission', {permission: 'read', nodeId: nodeId, userId: user.id});

	if (alreadyHavePermission)
	{
		if (action === 'remove')
		{
			await db.query(`
				DELETE FROM user_node_permission
				WHERE node_id = $1::int and user_id = $2::int
			`, nodeId, user.id);
		}

		return;
	}
	else if (action === 'remove')
	{
		return;
	}

	await db.query(`
		INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted)
		VALUES ($1::int, $2::int, $3::int, true), ($1::int, $2::int, $4::int, true);
	`, user.id, nodeId, constants.nodePermissions.read, constants.nodePermissions.reply);
}

save.apiTypes = {
	username: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	action: {
		type: APITypes.string,
		default: '',
		includes: ['add', 'remove'],
		required: true,
	},
}

export default save;