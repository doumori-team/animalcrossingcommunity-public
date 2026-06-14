import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, AdoptionBTSettingsType } from '@types';

/*
 * Adoptee BT Settings
 */
async function settings(this: APIThisType): Promise<AdoptionBTSettingsType>
{
	const users = await db.query(`
		SELECT
			user_account_cache.id,
			user_account_cache.username
		FROM user_node_permission
		JOIN user_account_cache ON (user_node_permission.user_id = user_account_cache.id)
		WHERE user_node_permission.node_id = $1::int AND user_node_permission.node_permission_id = $2
	`, constants.boardIds.adopteeBT, constants.nodePermissions.read);

	return <AdoptionBTSettingsType>{
		users: users,
	};
}

settings.permissions = [
	'adoption-bt-settings',
];

export default settings;
