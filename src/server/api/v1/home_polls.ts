import * as db from '@db';
import { APIThisType, HomePollsType } from '@types';

export default async function home_polls(this: APIThisType): Promise<HomePollsType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-polls' });

	if (!permissionGranted)
	{
		return {
			currentPoll: null,
			previousPoll: null,
		};
	}

	const [[currentPollId], [previousPollId]] = await Promise.all([
		db.query(`
			SELECT id
			FROM poll
			WHERE is_enabled AND now() BETWEEN start_date AND start_date + duration
			LIMIT 1
		`),
		db.query(`
			SELECT id
			FROM poll
			WHERE is_enabled AND start_date < now() - interval '7 days'
			ORDER BY start_date DESC
			LIMIT 1
		`),
	]);

	const [currentPoll, previousPoll] = await Promise.all([
		currentPollId ? this.query('v1/poll', { id: currentPollId.id }) : null,
		previousPollId ? this.query('v1/poll', { id: previousPollId.id }) : null,
	]);

	return <HomePollsType>{
		currentPoll: currentPoll,
		previousPoll: previousPoll,
	};
}
