import * as db from '@db';
import { constants } from '@utils';
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

	const staffIdentifiers = constants.staffIdentifiers;

	const [[nodeResult], [userResult], viewPTs, groupIds, [nodePermission], userData] = await Promise.all([
		db.query(`
			SELECT
				node.user_id,
				user_group.identifier,
				node.parent_node_id,
				node.locked,
				node.thread_type,
				parent.parent_node_id AS parent_node_id2,
				parent2.parent_node_id AS parent_node_id3,
				node.type
			FROM node
			LEFT JOIN node AS parent ON (node.parent_node_id = parent.id)
			LEFT JOIN node AS parent2 ON (parent.parent_node_id = parent2.id)
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
		this.query('v1/permission', { permission: 'view-other-private-threads' }),
		userId ? db.getUserGroups(userId) : [0],
		db.query(`
			SELECT id
			FROM node_permission
			WHERE identifier = $1
		`, permission),
		this.userId ? db.query(`
			SELECT ban_length.description
			FROM users
			JOIN ban_length ON (ban_length.id = users.current_ban_length_id)
			WHERE users.id = $1::int
		`, this.userId) : null,
	]);

	if (userData && userData[0] && userData[0].description)
	{
		return false;
	}

	if (nodeResult.locked && !this.userId)
	{
		return false;
	}

	// you can't do the following to a locked thread
	if (['lock', 'reply', 'sticky', 'admin-lock'].includes(permission) && nodeResult && nodeResult.locked !== null)
	{
		return false;
	}
	// only admins can reply to admin locked threads
	else if (['reply'].includes(permission) && nodeResult &&
		nodeResult.thread_type === 'admin' && ![constants.staffIdentifiers.admin, constants.staffIdentifiers.owner].includes(userResult?.identifier))
	{
		return false;
	}
	else if (nodeResult.user_id === userId)
	{
		// you always can lock / edit your own stuff
		if (['lock', 'edit'].includes(permission))
		{
			return true;
		}
		else if (permission === 'add-users')
		{
			// if node or parent is PTs or Shop Threads and it's yours you can add users to it
			if ([nodeResult.id, nodeResult.parent_node_id].some(id => [constants.boardIds.privateThreads, constants.boardIds.shopThread].includes(id)))
			{
				return true;
			}

			// otherwise have to check database, which will grant individually for Shop Threads
		}
	}
	else if (['edit'].includes(permission))
	{
		return false;
	}

	// grab user permissions, group permissions, in order of sequence (child nodes) > type (user / group) >
	// type_id (user id / group id). So it would check first node, by user first. If none, then check first
	// node, by group, main group first. Then go up a group until no groups. Then go to parent node and
	// restart the process. Whenever it finds one, it grabs the first one, then returns only if it grants access.
	let permissionGranted = [];

	// if we're directly viewing a PT / Shop Thread / Adoptee Thread,
	// only look at PTs / Shop Threads / Adoptee Thread you have access to OR you're a modmin
	if ([nodeResult.parent_node_id, nodeResult.parent_node_id2, nodeResult.parent_node_id3].some(nId => [constants.boardIds.privateThreads, constants.boardIds.shopThread, constants.boardIds.adopteeThread].includes(nId)))
	{
		if (permission === 'read' && viewPTs && ![staffIdentifiers.admin, staffIdentifiers.owner].includes(nodeResult?.identifier))
		{
			return true;
		}

		// modmins are given access in previous if statement
		// scouts are given access through group permissions but this is just easier
		if (nodeId === constants.boardIds.adopteeBT && userResult?.identifier === constants.staffIdentifiers.scout)
		{
			return true;
		}

		permissionGranted = await db.query(`
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
	}
	else
	{
		permissionGranted = await db.query(`
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
	}

	return permissionGranted.length > 0;
}

permission.apiTypes = {
	permission: {
		type: APITypes.string,
		includes: ['lock', 'read', 'reply', 'sticky', 'admin-lock', 'edit', 'move', 'add-users', 'remove-users'],
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
	permission: 'lock' | 'read' | 'reply' | 'sticky' | 'admin-lock' | 'edit' | 'move' | 'add-users' | 'remove-users'
	userId: number | APIThisType['userId']
	nodeId: number
};

export default permission;
