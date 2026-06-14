import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function vote(this: APIThisType, { pollId, choices }: voteProps): Promise<{ pollId: number }>
{
	const [poll] = await db.query(`
		SELECT
			node_revision_poll.id,
			node_revision_poll.is_multiple_choice,
			node_revision.node_id,
			COUNT(node_revision_poll_option.poll_id) AS option_count
		FROM node_revision_poll
		JOIN node_revision ON (node_revision.id = node_revision_poll.node_revision_id)
		LEFT JOIN node_revision_poll_option ON (node_revision_poll_option.poll_id = node_revision_poll.id)
		WHERE node_revision_poll.id = $1::int
		GROUP BY node_revision_poll.id, node_revision.node_id
	`, pollId);

	if (!poll)
	{
		throw new UserError('bad-format');
	}

	let errors: string[] = [];

	const permission: boolean = await this.query('v1/node/permission', { permission: 'reply', nodeId: poll.node_id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	if (!poll.is_multiple_choice && choices.length > 1)
	{
		errors.push('bad-format');
	}

	choices = choices.map((choice: number) =>
	{
		if (choice <= 0 || poll.option_count < choice)
		{
			errors.push('bad-format');
		}

		return choice;
	});

	if (errors.length > 0)
	{
		throw new UserError(...new Set(errors));
	}

	const [userVote] = await db.query(`
		SELECT node_revision_poll_answer.user_id as has_voted
		FROM node_revision_poll_answer
		WHERE user_id = $1::int AND poll_id = $2::int
	`, this.userId, pollId);

	if (userVote)
	{
		throw new UserError('bad-format');
	}

	await db.transaction(async (query: db.QueryType) =>
	{
		await Promise.all([
			query(`
				UPDATE node_revision_poll_option
				SET votes = votes + 1
				WHERE poll_id = $1::int AND sequence = ANY($2)
			`, pollId, choices),
			query(`
				INSERT INTO node_revision_poll_answer (poll_id, user_id)
				VALUES ($1::int, $2::int)
			`, pollId, this.userId),
		]);
	});

	return {
		pollId: poll.id,
	};
}

vote.permissions = [
	'userId',
];

vote.apiTypes = {
	pollId: {
		type: APITypes.number,
		required: true,
	},
	choices: {
		type: APITypes.array,
		subType: 'number',
		required: true,
	},
};

type voteProps = {
	pollId: number
	choices: number[]
};

export default vote;
