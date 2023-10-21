import * as db from '@db';
import { dateUtils } from '@utils';

/*
 * Provides information about the current status of the site, useful for display on almost every page.
 */
export default async function status()
{
	const [user, groupIds] = await Promise.all([
		this.userId ? this.query('v1/user', {id: this.userId}) : null,
		this.query('v1/users/user_groups'),
	]);

	const permissions = await db.query(`
		SELECT *
		FROM (
			-- grab first of each permission using the order by
			SELECT DISTINCT ON (identifier) *
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
					WHERE user_permission.user_id = $1

					UNION ALL

					SELECT
						'group' AS type,
						user_group_permissions.type_id,
						user_group_permissions.granted,
						user_group_permissions.identifier
					FROM user_group_permissions
					WHERE user_group_permissions.user_group_id = ANY($2)
				) AS permissions
				ORDER BY type DESC, type_id DESC
			) AS permissions
		) AS permissions
		-- only then do we grab those that are granted
		WHERE granted = true
	`, this.userId, groupIds);

	const identifiers = await Promise.all(permissions.map(async p => {
		switch (p.identifier)
		{
			case 'allow-post-images':
				if (this.userId && !dateUtils.isNewMember(user.signupDate))
				{
					return 'post-images';
				}

				break;
		}

		return p.identifier;
	}));

	return {
		user: user,
		permissions: identifiers,
	}
}