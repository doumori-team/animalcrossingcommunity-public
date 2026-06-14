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

	const threads: { id: number, title: string, creation_time: Date, user_id: number }[] = await db.cacheQuery(constants.cacheKeys.announcements, `
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

	return await Promise.all(threads.map(async thread =>
	{
		const [post] = await db.cacheQuery(constants.cacheKeys.announcements, `
			SELECT
				node.id AS node_id,
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

		const nodeFiles: { id: number, file_id: string, name: string, width: number | null, height: number | null, caption: string }[] = await db.cacheQuery(constants.cacheKeys.announcements, `
			SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = $1::int
			ORDER BY file.sequence ASC
		`, post.id);

		const nodeReactions: { node_id: number, emoji: string, count: number }[] = await db.cacheQuery(constants.cacheKeys.announcements, `
			SELECT node_reaction.node_id, node_reaction.emoji, count(*) AS count
			FROM node_reaction
			WHERE node_reaction.node_id = $1::int
			GROUP BY node_reaction.node_id, node_reaction.emoji
			ORDER BY count(*) DESC
		`, post.node_id);

		return <AnnouncementsType>{
			id: thread.id,
			title: thread.title,
			userId: thread.user_id,
			content: {
				text: post.content,
				format: post.content_format,
			},
			created: dateUtils.formatDateTime(thread.creation_time),
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
			reactions: nodeReactions.map(reaction =>
			{
				return {
					...reaction,
					src: reaction.emoji,
				};
			}),
		};
	}));
}
