import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { utils } from '@utils';

/*
 * Get permissions for user group.
 *
 * NOTE: Most retain return structure to match v1/admin/users/permissions.
 */
async function permissions({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'permission-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Confirm params
	let [groupId] = await db.query(`
		SELECT id
		FROM user_group
		WHERE id = $1::int
	`, id);

	if (!groupId)
	{
		throw new UserError('no-such-user-group');
	}

	groupId = groupId.id;

	let groupIds = [groupId];

	do
	{
		const [parentGroup] = await db.query(`
			SELECT parent_id
			FROM user_group
			WHERE id = $1::int
		`, groupId);

		groupId = parentGroup.parent_id;

		if (groupId !== null)
		{
			groupIds.push(groupId);
		}
	} while (groupId !== null);

	// Perform queries

	// Get site permissions & forum permissions
	const [nodePermissions, sitePermissions, boardPermissions] = await Promise.all([
		db.query(`
			SELECT node_permission.id, node_permission.description, node_permission.identifier
			FROM node_permission
			ORDER BY node_permission.id ASC
		`),
		db.query(`
			SELECT
				permissions.id,
				permissions.description,
				permissions.granted
			FROM (
				SELECT
					DISTINCT ON (identifier)
					permission.id,
					permission.description,
					permission.identifier,
					user_group_permission.user_group_id,
					user_groups_ordered.level,
					COALESCE(user_group_permission.granted, false) AS granted
				FROM permission
				LEFT JOIN user_group_permission ON (user_group_permission.permission_id = permission.id AND user_group_permission.user_group_id = ANY($1))
				LEFT JOIN user_groups_ordered ON (user_groups_ordered.id = user_group_permission.user_group_id)
				ORDER BY identifier ASC, level DESC
			) AS permissions
			ORDER BY permissions.id ASC
		`, groupIds),
		db.query(`
			SELECT *
			FROM (
				SELECT
					DISTINCT ON (node_id, node_permission_id)
					node.id AS node_id,
					(
						SELECT title
						FROM node_revision
						WHERE node_revision.node_id = node.id
						ORDER BY time DESC
						LIMIT 1
					) AS title,
					parent.id AS parent_id,
					parent.parent_node_id AS parent_id2,
					parent2.parent_node_id AS parent_id3,
					parent3.parent_node_id AS parent_id4,
					node_permission.id as node_permission_id,
					node_permission.identifier,
					user_group_node_permission.user_group_id,
					user_group_node_permission.node_id AS permission_node_id,
					COALESCE (user_group_node_permission.granted, false) AS granted,
					CASE
						WHEN user_group_node_permission.node_id = node.id THEN 1
						WHEN user_group_node_permission.node_id = parent.id THEN 2
						WHEN user_group_node_permission.node_id = parent.parent_node_id THEN 3
						WHEN user_group_node_permission.node_id = parent2.parent_node_id THEN 4
						WHEN user_group_node_permission.node_id = parent3.parent_node_id THEN 5
					END AS sequence,
					user_groups_ordered.level
				FROM node
				JOIN node_permission ON (node_permission.id >= 1)
				LEFT JOIN node AS parent ON (node.parent_node_id = parent.id)
				LEFT JOIN node AS parent2 ON (parent.parent_node_id = parent2.id)
				LEFT JOIN node AS parent3 ON (parent2.parent_node_id = parent3.id)
				LEFT JOIN user_group_node_permission ON (user_group_node_permission.node_permission_id = node_permission.id and user_group_node_permission.user_group_id = ANY($1) AND user_group_node_permission.node_id IN (node.id, parent.id, parent.parent_node_id, parent2.parent_node_id, parent3.parent_node_id))
				LEFT JOIN user_groups_ordered ON (user_groups_ordered.id = user_group_node_permission.user_group_id)
				WHERE node.type = 'board'
				ORDER BY node_id ASC, node_permission_id DESC, sequence ASC, user_groups_ordered.level DESC
			) as permissions
			ORDER BY permissions.title
		`, groupIds),
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
		type: APITypes.number,
		default: 0,
	},
}

export default permissions;