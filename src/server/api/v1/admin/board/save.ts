import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, {boardId, parentId, title, description, type}: saveProps) : Promise<SuccessType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'board-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	let isNewBoard = false;

	if (boardId != null && boardId > 0)
	{
		await db.query(`
			UPDATE node
			SET parent_node_id = $2::int, board_type = $3
			WHERE id = $1::int
		`, boardId, parentId, type);
	}
	else
	{
		const [newBoard] = await db.query(`
			INSERT INTO node (parent_node_id, type, board_type)
			VALUES ($1, 'board', $2)
			RETURNING id
		`, parentId, type);

		boardId = newBoard.id;
		isNewBoard = true;
	}

	const [board] = await db.query(`
		SELECT title, content
		FROM node_revision
		WHERE node_id = $1
		ORDER BY time DESC
		LIMIT 1
	`, boardId);

	if (!board || (board.title != title || board.content != description))
	{
		await db.query(`
			INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
			VALUES ($1, $2, $3, $4, $5)
		`, boardId, this.userId, title, description, 'markdown');
	}

	// temporary index until dev TLs updates main indexes (and should delete this one)
	if (isNewBoard)
	{
		await db.query(`
			CREATE INDEX CONCURRENTLY node_pni_tt_lrt_desc_include_no_type_board_${boardId} ON node (parent_node_id, thread_type DESC, latest_reply_time DESC) INCLUDE (id, user_id, type, creation_time, locked, reply_count) WHERE type != 'board' AND parent_node_id = ${boardId}
		`);
	}

	return {
		_success: 'The board has been added / modified.',
	};
}

save.apiTypes = {
	boardId: {
		type: APITypes.nodeId,
		nullable: true,
	},
	parentId: {
		type: APITypes.nodeId,
		required: true,
	},
	title: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.boardTitle,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		length: constants.max.boardDescription,
		profanity: true,
	},
	type: {
		type: APITypes.string,
		nullable: true,
		includes: constants.boardTypeOptions,
	},
}

type saveProps = {
	boardId: number|null
	parentId: number
	title: string
	description: string
	type: string|null
}

export default save;