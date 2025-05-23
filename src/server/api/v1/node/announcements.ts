import * as db from '@db';
import { constants, dateUtils } from '@utils';
import { APIThisType, AnnouncementsType } from '@types';

export default async function announcements(this: APIThisType): Promise<AnnouncementsType[]>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: constants.boardIds.announcements });

	if (!permission)
	{
		return [];
	}

	const threads = await db.cacheQuery(constants.cacheKeys.announcements, `
		SELECT
			node.id,
			(
				SELECT title
				FROM node_revision
				WHERE node_revision.node_id = node.id 
				ORDER BY time DESC
				LIMIT 1
			) AS title,
			node.creation_time,
			node.user_id
		FROM node
		WHERE node.parent_node_id = $1::int
		ORDER BY node.creation_time DESC
		LIMIT 5
	`, constants.boardIds.announcements);

	return await Promise.all(threads.map(async (thread: any) =>
	{
		const [post] = await db.cacheQuery(constants.cacheKeys.announcements, `
			SELECT
				last_revision.id,
				last_revision.content,
				last_revision.content_format
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id 
				ORDER BY time DESC
				LIMIT 1
			) last_revision ON true
			WHERE node.parent_node_id = $1::int
			ORDER BY node.creation_time ASC
			LIMIT 1
		`, thread.id);

		const nodeFiles = await db.cacheQuery(constants.cacheKeys.announcements, `
			SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = $1::int
			ORDER BY file.sequence ASC
		`, post.id);

		return <AnnouncementsType>{
			id: thread.id,
			title: thread.title,
			userId: thread.user_id,
			content: {
				text: post.content,
				format: post.content_format,
			},
			created: dateUtils.formatDateTime(thread.creation_time),
			files: nodeFiles ? nodeFiles.map((file: any) =>
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
		};
	}));
}
