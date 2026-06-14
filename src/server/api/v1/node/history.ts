import * as db from '@db';
import { dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeHistoryType, MarkupFormatType } from '@types';

/*
 * Get change history of node.
 */
async function history(this: APIThisType, { id }: historyProps): Promise<NodeHistoryType[]>
{
	const nodes: {
		id: number
		time: Date
		reviser_id: number
		title: string | null
		content: string | null
		content_format: MarkupFormatType | null
	}[] = await db.query(`
		SELECT
			id,
			time,
			reviser_id,
			title,
			content,
			content_format
		FROM node_revision
		WHERE node_id = $1::int
	`, id);

	return await Promise.all(nodes.map(async node =>
	{
		const nodeFiles: {
			id: number
			file_id: string
			name: string
			width: number | null
			height: number | null
			caption: string
		}[] = await db.query(`
			SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = $1::int
		`, node.id);

		return {
			id: node.id,
			formattedDate: dateUtils.formatDateTime(node.time),
			user: await this.query('v1/user_lite', { id: node.reviser_id }),
			title: node.title,
			content: {
				text: node.content,
				format: node.content_format,
			},
			files: nodeFiles ? nodeFiles.map(file =>
			{
				return {
					id: file.id,
					fileId: file.file_id,
					name: file.name,
					width: file.width,
					height: file.height,
					caption: file.caption,
				};
			}) : [],
			showImages: true,
		};
	}));
}

history.permissions = [
	'view-edit-history',
];

history.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
};

type historyProps = {
	id: number
};

export default history;
