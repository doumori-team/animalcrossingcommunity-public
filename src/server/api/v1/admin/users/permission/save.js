import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function save({id, sitePermissionIds, forumPermissions})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'permission-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Confirm params
	const user = await this.query('v1/user', {id: id});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	sitePermissionIds = await Promise.all(sitePermissionIds.map(async (sitePermissionId) =>
	{
		const [permission] = await db.query(`
			SELECT id
			FROM permission
			WHERE id = $1
		`, sitePermissionId);

		if (!permission)
		{
			throw new UserError('no-such-permission');
		}

		return Number(permission.id);
	}));

	forumPermissions = await Promise.all(forumPermissions.map(async (forumPermission) =>
	{
		const [boardId, typeId] = forumPermission.split('_');

		const [node] = await db.query(`
			SELECT id
			FROM node
			WHERE id = $1
		`, boardId);

		if (!node)
		{
			throw new UserError('no-such-node');
		}

		const [permission] = await db.query(`
			SELECT id
			FROM node_permission
			WHERE id = $1
		`, typeId);

		if (!permission)
		{
			throw new UserError('no-such-permission');
		}

		return {
			nodeId: Number(boardId),
			typeId: Number(typeId),
		};
	}));

	// Only owner can change owner perms
	if ([constants.staffIdentifiers.admin, constants.staffIdentifiers.owner].includes(user.group.identifier))
	{
		const currentUser = await this.query('v1/user', {id: this.userId});

		if (typeof(currentUser) === 'undefined' || currentUser.length === 0)
		{
			throw new UserError('no-such-user');
		}

		// Only owner can change owner group
		if (user.group.identifier === constants.staffIdentifiers.owner && currentUser.group.identifier !== constants.staffIdentifiers.owner)
		{
			throw new UserError('change-owner-perms-restricted');
		}

		// Precaution: admins cannot remove Permission Admin from admins
		if (user.group.identifier === constants.staffIdentifiers.admin)
		{
			const [permissionAdminPerm] = await db.query(`
				SELECT id
				FROM permission
				WHERE identifier = 'permission-admin'
			`);

			if (!sitePermissionIds.includes(permissionAdminPerm.id) && user.group.identifier !== constants.staffIdentifiers.owner)
			{
				throw new UserError('remove-permission-admin-restricted');
			}
		}
	}

	// Perform queries

	const groupIds = await this.query('v1/users/user_groups', {userId: user.id});

	await db.transaction(async query =>
	{
		const [sitePermissions, boardPermissions] = await Promise.all([
			query(`
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
						LEFT JOIN user_group_permission ON (user_group_permission.permission_id = permission.id AND user_group_permission.user_group_id = ANY($2))
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
						) AS ordered_user_groups ON (ordered_user_groups.id = user_group_permission.user_group_id)
					) AS permissions
					ORDER BY identifier asc, type DESC, type_id DESC
				) AS permissions
				ORDER BY permissions.permission_id ASC
			`, id, groupIds),
			query(`
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

						SELECT
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

		// Do site permissions

		// for each permission, check if value matches given value
		// sitePermissionIds contains granted values, assume anything not in it is not granted

		await Promise.all(sitePermissions.map(async (permission) => {
			const newGranted = sitePermissionIds.includes(permission.id);

			if (permission.granted !== newGranted)
			{
				await query(`
					INSERT INTO user_permission (user_id, permission_id, granted) VALUES
					($1::int, $2::int, $3)
					ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = $3
				`, user.id, permission.id, newGranted);
			}
		}));

		// Do forum permissions

		await Promise.all(boardPermissions.map(async (board) => {
			const newGranted = forumPermissions.some(fp => fp.nodeId === board.node_id && fp.typeId === board.node_permission_id);

			if (board.granted !== newGranted)
			{
				await query(`
					INSERT INTO user_node_permission (user_id, node_id, node_permission_id, granted) VALUES
					($1::int, $2::int, $3::int, $4)
					ON CONFLICT (user_id, node_id, node_permission_id) DO UPDATE SET granted = $3
				`, user.id, board.node_id, board.node_permission_id, newGranted);
			}
		}));
	});
}

save.apiTypes = {
	id: {
		type: APITypes.userId,
	},
	sitePermissionIds: {
		type: APITypes.array,
	},
	forumPermissions: {
		type: APITypes.array,
	},
}

export default save;