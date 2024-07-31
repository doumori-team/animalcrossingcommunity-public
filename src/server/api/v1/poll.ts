import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, PollType } from '@types';

/*
 * Retrieves Poll information.
 *
 * If the poll ID exists, returns an object with the following keys:
 * 		id - number - the poll's id
 * 		question - string - the poll's question
 * 		startDate - date - beginning time to allow vote submissions
 * 		endDate - date - ending time for receiving vote submissions
 * 		isMultipleChoice - boolean - whether this poll allows for multiple choices to be made
 * 		isEnabled - boolean - whether this poll is active -- inactive polls
 * 				won't be visible for regular users
 * 		userHasVoted - boolean - whether the currently logged-in user has voted for this poll
 * 		description - string - descriptive paragraph that can be added to a poll
 * 		options - object array - list of available options for this poll, structured in the following format:
 * 			description - string - option's description
 * 			sequence - number - position in which to display this option
 * 			votes - number - amount of votes received for this option
 */
async function poll(this: APIThisType, {id}: pollProps) : Promise<PollType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'view-polls'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [poll] = await db.query(`
		SELECT
			id,
			question,
			description,
			start_date,
			duration,
			start_date + duration as end_date,
			is_multiple_choice,
			is_enabled
		FROM poll
		WHERE poll.id = $1::int
	`, id);

	if (!poll)
	{
		throw new UserError('no-such-poll');
	}

	const [pollOptions, [userVote]] = await Promise.all([
		db.query(`
			SELECT
				description,
				sequence,
				votes
			FROM poll_option
			WHERE poll_option.poll_id = $1::int
			ORDER BY sequence
		`, poll.id),
		db.query(`
			SELECT
				user_id
			FROM poll_answer
			WHERE poll_id = $2::int AND user_id = $1::int
		`, this.userId, poll.id),
	]);

	return <PollType>{
		id: poll.id,
		question: poll.question,
		startDate: poll.start_date,
		endDate: poll.end_date,
		duration: poll.duration.days,
		isMultipleChoice: poll.is_multiple_choice,
		isEnabled: poll.is_enabled,
		userHasVoted: (userVote !== undefined),
		description: poll.description,
		options: pollOptions
	};
}

poll.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type pollProps = {
	id: number
}

export default poll;