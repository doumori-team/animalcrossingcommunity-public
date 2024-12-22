import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { faker } from '@faker-js/faker/locale/en';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Add X Threads with Y Posts to Z board.
 */
async function threads(this: APIThisType, { threads, posts, boardId }: threadsProps): Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Perform queries
	const staffUserIds = await db.query(`
		SELECT users.id
		FROM users
		JOIN user_group ON (user_group.id = users.user_group_id)
		JOIN user_group AS staff_group ON (user_group.parent_id = staff_group.id)
		WHERE staff_group.identifier = 'staff'
	`);

	for (let i = 0; i < threads; i++)
	{
		// create thread with first post
		const threadId = await db.transaction(async (query: any) =>
		{
			const threadUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
			const threadTitle = faker.lorem.words();
			const threadText = faker.lorem.sentences();

			// create thread
			const [thread] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, boardId, threadUserId, 'thread');

			await query(`
				INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
				VALUES ($1::int, $2::int, $3::text, $4, $5)
			`, thread.id, threadUserId, threadTitle, null, null);

			// create first post
			const [firstPost] = await query(`
				INSERT INTO node (parent_node_id, user_id, type)
				VALUES ($1::int, $2::int, $3::node_type)
				RETURNING id
			`, thread.id, threadUserId, 'post');

			await query(`
				INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
				VALUES ($1::int, $2::int, $3, $4::text, $5::node_content_format)
			`, firstPost.id, threadUserId, null, threadText, 'plaintext');

			return thread.id;
		});

		for (let j = 0; j < posts; j++)
		{
			const postUserId = (faker.helpers.arrayElement(staffUserIds) as any).id;
			const postText = faker.lorem.sentences();

			await db.transaction(async (query: any) =>
			{
				const [post] = await query(`
					INSERT INTO node (parent_node_id, user_id, type)
					VALUES ($1::int, $2::int, $3::node_type)
					RETURNING id
				`, threadId, postUserId, 'post');

				await query(`
					INSERT INTO node_revision (node_id, reviser_id, title, content, content_format)
					VALUES ($1::int, $2::int, $3, $4::text, $5::node_content_format)
				`, post.id, postUserId, null, postText, 'plaintext');
			});
		}

		await db.updateThreadStats(threadId);
	}

	return {
		_success: `Your thread(s) have been created!`,
	};
}

threads.apiTypes = {
	threads: {
		type: APITypes.number,
		required: true,
		max: 200,
		min: 1,
	},
	posts: {
		type: APITypes.number,
		required: true,
		max: 50,
		min: 1,
	},
	boardId: {
		type: APITypes.nodeId,
		required: true,
	},
};

type threadsProps = {
	threads: number
	posts: number
	boardId: number
};

export default threads;
