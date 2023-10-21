import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function save({boardId, parentId, title, description})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'board-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (boardId > 0)
	{
		await db.query(`
			UPDATE node
			SET parent_node_id = $2::int
			WHERE id = $1::int
		`, boardId, parentId);
	}
	else
	{
		const [board] = await db.query(`
			INSERT INTO node (parent_node_id, type)
			VALUES ($1, 'board')
			RETURNING id
		`, parentId);

		boardId = board.id;
	}

	await db.query(`
		INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
		VALUES ($1, $2, $3, $4, $5)
	`, boardId, this.userId, title, description, 'markdown');

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
}

export default save;