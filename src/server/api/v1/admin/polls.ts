import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, PollsType } from '@types';

async function polls(this: APIThisType, {type, page}: pollsProps) : Promise<PollsType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'polls-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let results = [], count = 0;

	const polls = await db.query(`
		SELECT
			id,
			count(*) over () AS count
		FROM poll
		WHERE is_enabled
			AND (
				$3 = 'previous'
				AND start_date + duration < now()
			)
			OR (
				$3 = 'upcoming'
				AND (
					-- Currently-running poll
					now() BETWEEN start_date AND start_date + duration
					-- Future polls
					OR now() < start_date
				)
			)
		ORDER BY start_date DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, type);

	if (polls.length > 0)
	{
		results = await Promise.all(polls.map(async (poll:any) => {
			return this.query('v1/poll', { id: poll.id });
		}));

		count = Number(polls[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
	};
}

polls.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	type: {
		type: APITypes.string,
		default: '',
		includes: [constants.pollTypes.upcoming, constants.pollTypes.previous],
		required: true,
	},
}

type pollsProps = {
	page: number
	type: string
}

export default polls;