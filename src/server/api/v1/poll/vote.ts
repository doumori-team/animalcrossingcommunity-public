import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function vote(this: APIThisType, { pollId, choices }: voteProps): Promise<{ pollId: number }>
{
	const permission: boolean = await this.query('v1/permission', { permission: 'vote-poll' });

	if (!permission)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [poll] = await db.query(`
		SELECT
			poll.id,
			poll.is_multiple_choice,
			poll.is_enabled,
			now() BETWEEN poll.start_date AND poll.start_date + poll.duration AS is_current,
			COUNT(poll_option.poll_id) AS option_count
		FROM poll
		LEFT JOIN poll_option ON (poll_option.poll_id = poll.id)
		WHERE poll.id = $1::int
		GROUP BY poll.id
	`, pollId);

	// Gathers any errors that may come from invalid inputs
	// to display them all at once.
	let errors = [];

	// This poll is not running yet or is not enabled.
	if (!poll.is_current || !poll.is_enabled)
	{
		errors.push('bad-format');
	}

	// User submitted multiple choices
	// for a Poll that only allows a single choice.
	if (!poll.is_multiple_choice && choices.length > 1)
	{
		errors.push('bad-format');
	}

	choices = choices.map((choice) =>
	{
		choice = Number(choice);

		if (isNaN(choice))
		{
			errors.push('bad-format');
		}
		// Selected choice is not available within this Poll.
		else if (choice <= 0 || poll.option_count < choice)
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
		SELECT
			poll_answer.user_id as has_voted
		FROM poll_answer
		WHERE user_id = $1::int AND poll_id = $2::int
	`, this.userId, pollId);

	// User has already voted for this Poll!
	if (userVote)
	{
		throw new UserError('bad-format');
	}

	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				UPDATE poll_option
				SET votes = votes + 1
				WHERE poll_id = $1::int AND sequence = ANY ($2)
			`, pollId, choices),
			query(`
				INSERT INTO poll_answer (poll_id, user_id)
				VALUES ($1::int, $2::int)
			`, pollId, this.userId),
		]);
	});

	return {
		pollId: poll.id,
	};
}

vote.apiTypes = {
	pollId: {
		type: APITypes.pollId,
		required: true,
	},
	choices: {
		type: APITypes.array,
	},
};

type voteProps = {
	pollId: number
	choices: any[]
};

export default vote;
