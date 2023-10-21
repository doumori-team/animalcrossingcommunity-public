import * as db from '@db';
import * as APITypes from '@apiTypes';

/*
 * Determines whether or not a user has a specific site-wide permission.
 */
async function permission({permission})
{
	const groupIds = await this.query('v1/users/user_groups');

	const permissionGranted = await db.query(`
		SELECT *
		FROM (
			SELECT *
			FROM (
				SELECT
					'user' AS type,
					user_permission.user_id AS type_id,
					user_permission.granted,
					permission.identifier
				FROM permission
				JOIN user_permission ON (user_permission.permission_id = permission.id)
				WHERE permission.identifier = $1 AND user_permission.user_id = $2

				UNION ALL

				SELECT
					'group' AS type,
					user_group_permissions.type_id,
					user_group_permissions.granted,
					user_group_permissions.identifier
				FROM user_group_permissions
				WHERE user_group_permissions.identifier = $1 AND user_group_permissions.user_group_id = ANY($3)
			) AS permissions
			ORDER BY type DESC, type_id DESC
			LIMIT 1
		) AS permissions
		WHERE granted = true
	`, permission, this.userId, groupIds);

	return permissionGranted.length > 0;
}

permission.apiTypes = {
	permission: {
		type: APITypes.string,
		required: true,
	},
}

export default permission;