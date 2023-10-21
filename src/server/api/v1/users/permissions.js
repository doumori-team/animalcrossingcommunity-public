import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { utils } from '@utils';

/*
 * Get permissions for user.
 *
 * NOTE: Most retain return structure to match v1/admin/user_group/permissions.
 */
async function permissions({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'permission-admin'});

	if (!permissionGranted)
	{
		// workaround to allow mods to access Profile Admin Page
		return {};
	}

	// Confirm params
	const user = await this.query('v1/user_lite', {id: id});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries
	const groupIds = await this.query('v1/users/user_groups', {userId: user.id});

	// Get site permissions & forum permissions
	const [nodePermissions, sitePermissions, boardPermissions] = await Promise.all([
		db.query(`
			SELECT node_permission.id, node_permission.description, node_permission.identifier
			FROM node_permission
			ORDER BY node_permission.id ASC
		`),
		db.query(`
			SELECT
				permissions.permission_id AS id,
				permissions.description,
				permissions.granted
			FROM (
				SELECT DISTINCT ON (identifier) *
				FROM (
					-- join here, but left join on group type, so only one permission is show if both are null
					SELECT
						'user' AS type,
						user_permission.user_id AS type_id,
						COALESCE(user_permission.granted, false) AS granted,
						permission.id AS permission_id,
						permission.description,
						permission.identifier
					FROM permission
					JOIN user_permission ON (user_permission.permission_id = permission.id)
					WHERE user_permission.user_id = $1

					UNION ALL

					SELECT
						'group' AS type,
						ordered_user_groups.level AS type_id,
						COALESCE(user_group_permission.granted, false) as granted,
						permission.id as permission_id,
						permission.description,
						permission.identifier
					FROM permission
					left JOIN user_group_permission ON (user_group_permission.permission_id = permission.id AND user_group_permission.user_group_id = ANY($2))
					left JOIN (
						WITH RECURSIVE ENTRIES as (
							SELECT id, parent_id, name, id AS root_id, 1 AS level
							FROM user_group
							WHERE parent_id IS NULL
							UNION ALL
							SELECT c.id, c.parent_id, c.name, p.root_id, p.level + 1
							FROM user_group c
							JOIN entries p ON (p.id = c.parent_id)
						)
						SELECT id, name, level
						FROM entries
						ORDER BY root_id, level, id
					) AS ordered_user_groups ON (ordered_user_groups.id = user_group_permission.user_group_id)
				) AS permissions
				ORDER BY identifier asc, type DESC, type_id DESC
			) AS permissions
			ORDER BY permissions.permission_id ASC
		`, id, groupIds),
		db.query(`
			SELECT *
			FROM (
				SELECT DISTINCT ON (node_id, node_permission_id) *
				FROM (
					SELECT
						'user' AS type,
						user_node_permission.node_id,
						(
							SELECT title
							FROM node_revision
							WHERE node_revision.node_id = node.id
							ORDER BY time DESC
							LIMIT 1
						) AS title,
						parent.id AS parent_id,
						node_permission.id AS node_permission_id,
						node_permission.identifier,
						COALESCE(user_node_permission.granted, false) AS granted,
						CASE
							WHEN user_node_permission.node_id = node.id THEN 1
							WHEN user_node_permission.node_id = parent.id THEN 2
							WHEN user_node_permission.node_id = parent.parent_node_id THEN 3
							WHEN user_node_permission.node_id = parent2.parent_node_id THEN 4
							WHEN user_node_permission.node_id = parent3.parent_node_id THEN 5
						END as sequence,
						user_node_permission.user_id AS type_id
					FROM node
					JOIN node_permission ON (node_permission.id >= 1)
					LEFT JOIN node AS parent ON (node.parent_node_id = parent.id)
					LEFT JOIN node AS parent2 ON (parent.parent_node_id = parent2.id)
					LEFT JOIN node AS parent3 ON (parent2.parent_node_id = parent3.id)
					JOIN user_node_permission ON (user_node_permission.node_permission_id = node_permission.id AND user_node_permission.node_id IN (node.id, parent.id, parent.parent_node_id, parent2.parent_node_id, parent3.parent_node_id) AND user_node_permission.user_id = $1)
					WHERE node.type = 'board'

					UNION ALL

					select
						'group' AS type,
						node.id AS node_id,
						(
							SELECT title
							FROM node_revision
							WHERE node_revision.node_id = node.id
							ORDER BY time DESC
							LIMIT 1
						) AS title,
						parent.id AS parent_id,
						node_permission.id AS node_permission_id,
						node_permission.identifier,
						COALESCE(user_group_node_permission.granted, false) AS granted,
						CASE
							WHEN user_group_node_permission.node_id = node.id THEN 1
							WHEN user_group_node_permission.node_id = parent.id THEN 2
							WHEN user_group_node_permission.node_id = parent.parent_node_id THEN 3
							WHEN user_group_node_permission.node_id = parent2.parent_node_id THEN 4
							WHEN user_group_node_permission.node_id = parent3.parent_node_id THEN 5
						END AS sequence,
						ordered_user_groups.level AS type_id
					FROM node
					JOIN node_permission ON (node_permission.id >= 1)
					LEFT JOIN node AS parent ON (node.parent_node_id = parent.id)
					LEFT JOIN node AS parent2 ON (parent.parent_node_id = parent2.id)
					LEFT JOIN node AS parent3 ON (parent2.parent_node_id = parent3.id)
					LEFT JOIN user_group_node_permission ON (user_group_node_permission.node_permission_id = node_permission.id and user_group_node_permission.user_group_id = ANY($2) AND user_group_node_permission.node_id IN (node.id, parent.id, parent.parent_node_id, parent2.parent_node_id, parent3.parent_node_id))
					LEFT JOIN (
						WITH RECURSIVE ENTRIES as (
							SELECT id, parent_id, name, id AS root_id, 1 AS level
							FROM user_group
							WHERE parent_id IS NULL
							UNION ALL
							SELECT c.id, c.parent_id, c.name, p.root_id, p.level + 1
							FROM user_group c
							JOIN entries p ON (p.id = c.parent_id)
						)
						SELECT id, name, level
						FROM entries
						ORDER BY root_id, level, id
					) AS ordered_user_groups ON (ordered_user_groups.id = user_group_node_permission.user_group_id)
					WHERE node.type = 'board'
				) AS permissions
				ORDER BY node_id ASC, node_permission_id DESC, sequence ASC, type DESC, type_id DESC
			) AS permissions
			ORDER BY permissions.title ASC
		`, id, groupIds),
	]);

	return {
		site: sitePermissions,
		forum: {
			types: nodePermissions,
			boards: utils.getChildBoards(boardPermissions, null),
		},
	};
}

permissions.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default permissions;