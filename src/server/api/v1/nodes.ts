import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodesType, NodeChildNodesType, NodeBoardType } from '@types';

/**
 * NodePage calls. Moved here for George.
 * No APITypes on purpose.
 */
async function nodes(this: APIThisType, { id, page, editId, locked, order, reverse }: nodesProps): Promise<NodesType>
{
	const [archivedBoards, listBoardsArr] = await Promise.all([
		db.query(`
			SELECT id
			FROM node
			WHERE type = 'board' AND board_type = 'archived'
		`),
		![constants.boardIds.publicThreads, constants.boardIds.privateThreads].includes(id) ? db.query(`
			SELECT id
			FROM node
			WHERE id = $1 AND type = 'board' AND id NOT IN (
				SELECT node.parent_node_id
				FROM node
				WHERE node.parent_node_id = $1 AND node.type = 'thread'
				LIMIT 1
			)
		`, id) : [],
	]);

	const archivedBoardIds: number[] = archivedBoards.map((x: { id: string }) => Number(x.id));

	if (archivedBoardIds.includes(id))
	{
		locked = true;
	}

	const listBoardIds: number[] = listBoardsArr.map((x: { id: string }) => Number(x.id));
	const listBoards = listBoardIds.includes(id);

	const [node, canMoveThread, editNode, currentUserEmojiSettings, subBoards, returnValue, staffBoards] = await Promise.all([
		this.query('v1/node/full', { id, loadingNode: true }),
		this.userId ? this.query('v1/node/permission', {
			permission: 'move',
			nodeId: id,
		}) : false,
		editId ? this.query('v1/node/full', { id: editId }) : null,
		id !== constants.boardIds.accForums ? this.query('v1/settings/emoji') : [],
		this.query('v1/node/boards', { nodeIds: [id] }),
		!listBoards ? this.query('v1/node/children', { id: id, order: order ? order : 'latest_reply_time', reverse: reverse ? reverse : true, page: page ? page : 1, showLocked: locked }) : null,
		db.query(`
			SELECT id
			FROM node
			WHERE type = 'board' AND board_type = 'staff'
		`),
	]);

	const userIds: number[] = node.type === 'thread' ? returnValue.childNodes.map((cn: NodeChildNodesType) => cn.user?.id).filter((userId?: number) => !!userId) : [];

	const [userEmojiSettings, breadcrumb, allBoards, subSubBoards, userDonations] = await Promise.all([
		userIds.length > 0 ? this.query('v1/settings/emoji', { userIds: returnValue.childNodes.map((cn: NodeChildNodesType) => cn.user?.id).filter((id?: number) => id) }) : [],
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
		canMoveThread && node.type === 'thread' ? this.query('v1/node/boards') : [],
		listBoards ? this.query('v1/node/boards', { nodeIds: subBoards.map((b: NodeBoardType) => b.id) }) : [],
		this.userId ? this.query('v1/users/donations') : null,
	]);

	return <NodesType>{
		node,
		breadcrumb,
		childNodes: listBoards ? subBoards : returnValue.childNodes,
		page: listBoards ? page : returnValue.page,
		totalCount: listBoards ? 0 : returnValue.count,
		pageSize: listBoards ? node.type === 'board' ? 50 : constants.threadPageSize : returnValue.pageSize,
		reverse: listBoards ? reverse : returnValue.reverse,
		order: listBoards ? order : returnValue.order,
		locked: listBoards ? locked : returnValue.showLocked,
		editNode: editNode,
		currentUserEmojiSettings: currentUserEmojiSettings,
		nodeUsersEmojiSettings: userEmojiSettings,
		boards: allBoards,
		subBoards: listBoards ? subSubBoards : subBoards,
		staffBoards: staffBoards.map((x: { id: string }) => Number(x.id)),
		archivedBoards: archivedBoardIds,
		listBoards: listBoardIds,
		userDonations: userDonations,
	};
}

nodes.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	// others not checked on purpose
};

const _orderOptions = constants.orderOptions.node.map(x => x.id);

type nodesProps = {
	id: number,
	page: string
	editId: string
	locked: string | boolean
	order: typeof _orderOptions[number]
	reverse: string
};

export default nodes;
