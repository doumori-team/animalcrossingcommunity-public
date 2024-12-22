import * as db from '@db';
import { dateUtils } from '@utils';
import { APIThisType, StatusType } from '@types';

/*
 * Provides information about the current status of the site, useful for display on almost every page.
 * See iso-server, used for tracking last active time & page requests.
 */
export default async function status(this: APIThisType): Promise<StatusType>
{
	const [userData] = await Promise.all([
		this.userId ? db.query(`
			SELECT ban_length.description
			FROM users
			JOIN ban_length ON (ban_length.id = users.current_ban_length_id)
			WHERE users.id = $1::int
		`, this.userId) : null,
	]);

	if (userData && userData[0] && userData[0].description)
	{
		return {
			user: null,
			permissions: [],
			southernHemisphere: false,
			banLength: userData[0].description,
		};
	}

	const [user, groupIds, settings] = await Promise.all([
		this.userId ? this.query('v1/user', { id: this.userId }) : null,
		db.getUserGroups(this.userId),
		this.userId ? db.query(`
			SELECT southern_hemisphere
			FROM users
			WHERE users.id = $1::int
		`, this.userId) : null,
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

	const identifiers = await Promise.all(permissions.map(async (p: any) =>
	{
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

	return <StatusType>{
		user: user,
		permissions: identifiers,
		southernHemisphere: settings ? settings[0].southern_hemisphere : false,
	};
}
