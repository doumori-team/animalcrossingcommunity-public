import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';
import { UserError } from '@errors';

/*
 * Determines whether or not a user has a specific site-wide permission.
 */
async function permission(this: APIThisType, { permission, userId }: permissionProps): Promise<boolean>
{
	// can bypass if we're looking at anonymous user
	if (userId !== this.userId && userId !== 0 && this.userId !== undefined)
	{
		const isAdmin: boolean = await this.query('v1/permission', { permission: 'permission-admin' });

		if (!isAdmin)
		{
			throw new UserError('permission');
		}
	}

	const [groupIds, userData] = await Promise.all([
		db.getUserGroups(userId),
		userId ? db.query(`
			SELECT ban_length.description
			FROM users
			JOIN ban_length ON (ban_length.id = users.current_ban_length_id)
			WHERE users.id = $1::int
		`, userId) : null,
	]);

	if (userData && userData[0] && userData[0].description)
	{
		return false;
	}

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
	`, permission, userId, groupIds);

	return permissionGranted.length > 0;
}

permission.apiTypes = {
	permission: {
		type: APITypes.string,
		required: true,
	},
	userId: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
};

type permissionProps = {
	permission: string
	userId: APIThisType['userId']
};

export default permission;
