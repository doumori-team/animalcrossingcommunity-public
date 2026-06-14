import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserLiteType } from '@types';

/*
 * Save settings for adoption buddy thread.
 */
async function save(this: APIThisType, { addUser, action }: saveProps): Promise<void>
{
	// Check parameters
	const user: UserLiteType = await this.query('v1/user_lite', { username: addUser });

	// Update permissions
	const nodeId = constants.boardIds.adopteeBT;

	const alreadyHavePermission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: nodeId, userId: user.id });

	if (alreadyHavePermission)
	{
		if (action === 'remove')
		{
			await db.query(`
				DELETE FROM user_node_permission
				WHERE node_id = $1::int AND user_id = $2::int
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
		VALUES ($1::int, $2::int, $3::int, true), ($1::int, $2::int, $4::int, true), ($1::int, $2::int, $5::int, true);
	`, user.id, nodeId, constants.nodePermissions.read, constants.nodePermissions.reply, constants.nodePermissions.react);
}

save.permissions = [
	'adoption-bt-settings',
];

save.apiTypes = {
	addUser: {
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
};

type saveProps = {
	addUser: string
	action: 'add' | 'remove'
};

export default save;
