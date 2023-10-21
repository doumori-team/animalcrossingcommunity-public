import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

/*
 * Get change history of node.
 */
async function history({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-edit-history'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const nodes = await db.query(`
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

	return await Promise.all(nodes.map(async (node) => {
		const nodeFiles = await db.query(`
			SELECT file.id, file.file_id, file.name, file.width, file.height
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = $1::int
		`, node.id);

		return {
			id: node.id,
			formattedDate: dateUtils.formatDateTime(node.time),
			user: await this.query('v1/user_lite', {id: node.reviser_id}),
			title: node.title,
			content: {
				text: node.content,
				format: node.content_format,
			},
			files: nodeFiles ? nodeFiles.map(file => {
				return {
					id: file.id,
					fileId: file.file_id,
					name: file.name,
					width: file.width,
					height: file.height,
				}
			}) : [],
			showImages: true,
		};
	}));
}

history.apiTypes = {
	id: {
		type: APITypes.nodeId,
	},
}

export default history;