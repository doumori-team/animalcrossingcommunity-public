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
	const [userGroup] = await db.query(`
		SELECT id, identifier
		FROM user_group
		WHERE id = $1::int
	`, id);

	if (!userGroup)
	{
		throw new UserError('no-such-user-group');
	}

	let groupId = userGroup.id;

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

	if ([constants.staffIdentifiers.admin, constants.staffIdentifiers.owner].includes(userGroup.identifier))
	{
		const user = await this.query('v1/user', {id: this.userId});

		if (typeof(user) === 'undefined' || user.length === 0)
		{
			throw new UserError('no-such-user');
		}

		// Only owner can change owner group
		if (userGroup.identifier === constants.staffIdentifiers.owner && user.group.identifier !== constants.staffIdentifiers.owner)
		{
			throw new UserError('change-owner-perms-restricted');
		}

		// Precaution: admins cannot remove Permission Admin from admins
		if (userGroup.identifier === constants.staffIdentifiers.admin)
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

	await db.transaction(async query =>
	{
		const [sitePermissions, boardPermissions] = await Promise.all([
			query(`
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
			query(`
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
						COALESCE(user_group_node_permission.granted, false) AS granted,
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

		// Do site permissions

		// for each permission, check if value matches given value
		// sitePermissionIds contains granted values, assume anything not in it is not granted

		await Promise.all(sitePermissions.map(async (permission) => {
			const newGranted = sitePermissionIds.includes(permission.id);

			if (permission.granted !== newGranted)
			{
				await query(`
					INSERT INTO user_group_permission (user_group_id, permission_id, granted) VALUES
					($1::int, $2::int, $3)
					ON CONFLICT (user_group_id, permission_id) DO UPDATE SET granted = $3
				`, id, permission.id, newGranted);
			}
		}));

		// Do forum permissions

		await Promise.all(boardPermissions.map(async (board) => {
			const newGranted = forumPermissions.some(fp => fp.nodeId === board.node_id && fp.typeId === board.node_permission_id);

			if (board.granted !== newGranted)
			{
				await query(`
					INSERT INTO user_group_node_permission (user_group_id, node_id, node_permission_id, granted) VALUES
					($1::int, $2::int, $3::int, $4)
					ON CONFLICT (user_group_id, node_id, node_permission_id) DO UPDATE SET granted = $3
				`, id, board.node_id, board.node_permission_id, newGranted);
			}
		}));
	});
}

save.apiTypes = {
	id: {
		type: APITypes.number,
		default: 0,
	},
	sitePermissionIds: {
		type: APITypes.array,
	},
	forumPermissions: {
		type: APITypes.array,
	},
}

export default save;