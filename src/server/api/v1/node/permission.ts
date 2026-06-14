import * as db from '@db';
import { constants, utils } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

/*
 * Determines whether or not a user has a specific permission for
 * 	interacting with a certain node.
 * Available only to the user themself, or to a user with the
 * 	'permission-admin' permission.
 */
async function permission(this: APIThisType, { permission, userId, nodeId }: permissionProps): Promise<boolean>
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

	const [[nodeResult], [userResult], viewPTs, groupIds, [nodePermission], userData]: [[{
		user_id: number
		identifier: string
		parent_node_id: number | null
		locked: Date | null
		thread_type: string
		parent_node_id2: number | null
	}], [{ identifier: string } | undefined], boolean, number[], [{ id: number }], [{ description: string | null }] | null] = await Promise.all([
		db.query(`
			SELECT
				node.user_id,
				user_group.identifier,
				node.parent_node_id,
				node.locked,
				node.thread_type,
				parent.parent_node_id AS parent_node_id2
			FROM node
			LEFT JOIN node AS parent ON (node.parent_node_id = parent.id)
			LEFT JOIN users ON (users.id = node.user_id)
			LEFT JOIN user_group ON (users.user_group_id = user_group.id)
			WHERE node.id = $1::int
		`, nodeId),
		db.query(`
			SELECT user_group.identifier
			FROM users
			JOIN user_group ON (users.user_group_id = user_group.id)
			WHERE users.id = $1::int
		`, userId),
		this.query('v1/permission', { permission: 'view-other-private-threads', userId: userId }),
		userId ? db.getUserGroups(userId) : [0],
		db.query(`
			SELECT id
			FROM node_permission
			WHERE identifier = $1
		`, permission),
		userId ? db.query(`
			SELECT ban_length.description
			FROM users
			JOIN ban_length ON (ban_length.id = users.current_ban_length_id)
			WHERE users.id = $1::int
		`, userId) : null,
	]);

	// if you're banned, you don't have any permissions
	if (userData && userData[0] && userData[0].description)
	{
		utils.log('v1/node/permission, returning false, user is banned', permission, userId, nodeId);
		return false;
	}

	// if the thread is locked, we prevent access to non-users
	if (nodeResult.locked && !this.userId)
	{
		utils.log('v1/node/permission, returning false, user is anonymous and node is locked', permission, userId, nodeId);
		return false;
	}

	// you can't do the following to a locked thread
	if (['lock', 'reply', 'sticky', 'admin-lock'].includes(permission) && nodeResult.locked !== null)
	{
		utils.log('v1/node/permission, returning false, cannot lock/reply/sticky/admin-lock locked thread', permission, userId, nodeId);
		return false;
	}
	// only admins can reply to admin locked threads
	else if (['reply'].includes(permission) && nodeResult.thread_type === 'admin' && (!userResult || ![constants.staffIdentifiers.admin, constants.staffIdentifiers.owner].includes(userResult.identifier)))
	{
		utils.log('v1/node/permission, returning false, cannot reply to admin-locked thread', permission, userId, nodeId);
		return false;
	}
	else if (nodeResult.user_id === userId)
	{
		// you always can lock / edit your own stuff
		if (['lock', 'edit'].includes(permission))
		{
			utils.log('v1/node/permission, returning true, can lock/edit your own stuff', permission, userId, nodeId);
			return true;
		}
		else if (permission === 'add-users')
		{
			// if parent is PTs or Shop Threads and it's yours you can add users to it
			if (nodeResult.parent_node_id !== null && [constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(nodeResult.parent_node_id))
			{
				utils.log('v1/node/permission, returning true, can add users to your own PT / Shop Thread', permission, userId, nodeId);
				return true;
			}

			// otherwise have to check database, which will grant individually for Shop Threads
		}
	}
	else if (['edit'].includes(permission))
	{
		utils.log('v1/node/permission, returning false, cannot edit not your own stuff', permission, userId, nodeId);
		return false;
	}

	// just look at user_node_permissions for PT / Shop Thread / Adoptee Thread
	if ([nodeResult.parent_node_id, nodeResult.parent_node_id2].some(nId => nId !== null && [constants.boardIds.privateThreads, constants.boardIds.shopThread, constants.boardIds.adopteeThread].includes(nId)))
	{
		// if we're directly viewing a PT / Shop Thread / Adoptee Thread,
		// only look at PTs / Shop Threads / Adoptee Thread you have access to OR you're a modmin
		// modmins can't view admin+ PTs here, but admins can always view their own PTs even if they removed themselves
		if (permission === 'read' && viewPTs && (![constants.staffIdentifiers.admin, constants.staffIdentifiers.owner].includes(nodeResult.identifier) || userId === nodeResult.user_id))
		{
			utils.log('v1/node/permission, returning true, user can read PT', permission, userId, nodeId);
			return true;
		}

		// modmins are given access in previous if statement
		// scouts are given access through group permissions but this is just easier
		// (easier because we're only looking at user perms here below)
		if (['read', 'reply', 'react'].includes(permission) && [nodeId, nodeResult.parent_node_id].includes(constants.boardIds.adopteeBT) && userResult?.identifier === constants.staffIdentifiers.scout)
		{
			utils.log('v1/node/permission, returning true, scout can read/reply/react to Adoptee BT', permission, userId, nodeId);
			return true;
		}

		const permissionGranted = await db.query(`
			SELECT *
			FROM (
				SELECT *
				FROM (
					SELECT
						user_node_permissions.type_id,
						user_node_permissions.node_id,
						user_node_permissions.granted,
						user_node_permissions.sequence
					FROM user_node_permissions
					WHERE user_node_permissions.id = $3 AND user_node_permissions.type_id = $2 AND user_node_permissions.node_permission_id = $1
				) AS permissions
				ORDER BY sequence ASC, type_id DESC
				LIMIT 1
			) AS permissions
			WHERE granted = true
		`, nodePermission.id, userId, nodeId);

		utils.log(`v1/node/permission, returning ${permissionGranted.length > 0}, using user_node_permissions, PT / Shop Thread / Adoptee Thread`, permission, userId, nodeId);

		return permissionGranted.length > 0;
	}

	// grab user permissions, group permissions, in order of sequence (child nodes) > type (user / group) >
	// type_id (user id / group id). So it would check first node, by user first. If none, then check first
	// node, by group, main group first. Then go up a group until no groups. Then go to parent node and
	// restart the process. Whenever it finds one, it grabs the first one, then returns only if it grants access.
	const permissionGranted = await db.query(`
		SELECT *
		FROM (
			SELECT *
			FROM (
				SELECT
					'user' AS type,
					user_node_permissions.type_id,
					user_node_permissions.node_id,
					user_node_permissions.granted,
					user_node_permissions.sequence
				FROM user_node_permissions
				WHERE user_node_permissions.id = $3 AND user_node_permissions.type_id = $2 AND user_node_permissions.node_permission_id = $1

				UNION ALL

				SELECT
					'group' AS type,
					user_group_node_permissions.type_id,
					user_group_node_permissions.node_id,
					user_group_node_permissions.granted,
					user_group_node_permissions.sequence
				FROM user_group_node_permissions
				WHERE user_group_node_permissions.id = $3 AND user_group_node_permissions.user_group_id = ANY($4) AND user_group_node_permissions.node_permission_id = $1
			) AS permissions
			ORDER BY sequence ASC, type DESC, type_id DESC
			LIMIT 1
		) AS permissions
		WHERE granted = true
	`, nodePermission.id, userId, nodeId, groupIds);

	utils.log(`v1/node/permission, returning ${permissionGranted.length > 0}, using all permissions`, permission, userId, nodeId);

	return permissionGranted.length > 0;
}

permission.apiTypes = {
	permission: {
		type: APITypes.string,
		includes: ['lock', 'read', 'reply', 'sticky', 'admin-lock', 'edit', 'move', 'add-users', 'remove-users', 'react'],
		required: true,
	},
	userId: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
	nodeId: {
		type: APITypes.nodeId,
		required: true,
	},
};

type permissionProps = {
	permission: 'lock' | 'read' | 'reply' | 'sticky' | 'admin-lock' | 'edit' | 'move' | 'add-users' | 'remove-users' | 'react'
	userId: number | APIThisType['userId']
	nodeId: number
};

export default permission;
