import * as db from '@db';
import { constants } from '@utils';

/**
 * NodePage calls. Moved here for George.
 * No APITypes on purpose.
 */
export default async function nodes({id, page, editId, addUsers, locked, order, reverse})
{
	const [node, canMoveThread, editNode, currentUserEmojiSettings, subBoards, returnValue] = await Promise.all([
		this.query('v1/node/full', {id, loadingNode: true}),
		this.userId ? this.query('v1/node/permission', {
			permission: 'move',
			nodeId: id
		}) : false,
		editId ? this.query('v1/node/full', {id: editId}) : null,
		id !== constants.boardIds.accForums ? this.query('v1/settings/emoji') : [],
		this.query('v1/node/boards', {nodeIds: [id]}),
		this.query('v1/node/children', {id: id, order: order ? order : 'latest_reply_time', reverse: reverse ? reverse : true, page: page ? page : 1, showLocked: locked}),
	]);

	const userIds = node.type === 'thread' ? returnValue.childNodes.map(cn => cn.user?.id).filter(userId => userId != undefined) : [];

	const listBoards = [constants.boardIds.accForums, constants.boardIds.trading, constants.boardIds.archivedBoards, constants.boardIds.archivedStaffBoards, constants.boardIds.archivedAdminBoards, constants.boardIds.siteRelated, constants.boardIds.featuresDashboard, constants.boardIds.archivedSpecialProjects].includes(node.id);

	const [userEmojiSettings, breadcrumb, buddies, whitelistedUsers, allBoards, subSubBoards] = await Promise.all([
		userIds.length > 0 ? this.query('v1/settings/emoji', {userIds: returnValue.childNodes.map(cn => cn.user?.id).filter(id => id)}) : [],
		id !== constants.boardIds.accForums ? db.query(`
			WITH RECURSIVE tree(id, parent_node_id, title, level) AS (
				SELECT n.id, n.parent_node_id, (
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = n.id
					ORDER BY time DESC
					LIMIT 1
				) AS title, 1 AS level
				FROM node n
				WHERE n.id = $1
				UNION ALL
				SELECT n.id, n.parent_node_id, (
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = n.id
					ORDER BY time DESC
					LIMIT 1
				) AS title, t.level + 1 AS level
				FROM node n
				JOIN tree t ON (n.id = t.parent_node_id)
			)
			SELECT id, title
			FROM tree
			ORDER BY level DESC;
		`, node.parentId) : [],
		node.type === 'thread' ? this.query('v1/users/buddies') : [],
		node.type === 'thread' ? this.query('v1/friend_code/whitelist/users') : [],
		canMoveThread && node.type === 'thread' ? this.query('v1/node/boards') : [],
		listBoards ? this.query('v1/node/boards', {nodeIds: subBoards.map(b => b.id)}) : [],
	]);

	return {
		node,
		breadcrumb,
		childNodes: listBoards ? returnValue.childNodes.concat(subBoards) : returnValue.childNodes,
		page: returnValue.page,
		totalCount: returnValue.count,
		pageSize: returnValue.pageSize,
		addUsers: addUsers,
		reverse: returnValue.reverse,
		order: returnValue.order,
		locked: returnValue.showLocked,
		editNode: editNode,
		currentUserEmojiSettings: currentUserEmojiSettings,
		nodeUsersEmojiSettings: userEmojiSettings,
		buddies,
		whitelistedUsers,
		boards: allBoards,
		subBoards: listBoards ? subSubBoards : subBoards,
	};
}