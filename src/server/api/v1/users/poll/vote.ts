import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function vote(this: APIThisType, { pollId, choices }: voteProps): Promise<{ pollId: number }>
{
	const [poll] = await db.query(`
		SELECT
			user_poll.id,
			user_poll.is_multiple_choice,
			user_poll.active,
			COUNT(user_poll_option.poll_id) AS option_count
		FROM user_poll
		LEFT JOIN user_poll_option ON (user_poll_option.poll_id = user_poll.id)
		WHERE user_poll.id = $1::int
		GROUP BY user_poll.id
	`, pollId);

	if (!poll)
	{
		throw new UserError('bad-format');
	}

	let errors: string[] = [];

	if (!poll.active)
	{
		errors.push('bad-format');
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
		SELECT user_poll_answer.user_id as has_voted
		FROM user_poll_answer
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
				UPDATE user_poll_option
				SET votes = votes + 1
				WHERE poll_id = $1::int AND sequence = ANY($2)
			`, pollId, choices),
			query(`
				INSERT INTO user_poll_answer (poll_id, user_id)
				VALUES ($1::int, $2::int)
			`, pollId, this.userId),
		]);
	});

	return {
		pollId: poll.id,
	};
}

vote.permissions = [
	'view-profiles',
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
