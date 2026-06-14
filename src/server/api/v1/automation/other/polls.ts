import { faker } from '@faker-js/faker/locale/en';

import * as db from '@db';
import { dateUtils } from '@utils';
import { APIThisType, SuccessType } from '@types';

async function polls(this: APIThisType): Promise<SuccessType | null>
{
	if (!this.userId)
	{
		return null;
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

	if (currentPollId && previousPollId)
	{
		return {
			_notice: 'Polls already exist on the homepage.',
		};
	}

	// doesn't do dateUtils stuff, so this should never be copied
	// only ever run on server in UTC time
	const today = new Date();

	if (!currentPollId)
	{
		const currentPollQuestion = faker.lorem.sentence();
		const currentPollDescription = faker.datatype.boolean() ? faker.lorem.sentence() : null;

		const currentLastSunday = new Date(today);
		currentLastSunday.setDate(today.getDate() - today.getDay());
		const currentPollStartDate = dateUtils.formatYearMonthDay(currentLastSunday) + ' 05:00:00';

		const currentPollOptions = Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => faker.lorem.word());

		const [currentPollResult] = await db.query(`
			INSERT INTO poll (question, description, start_date, duration, is_multiple_choice, is_enabled)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, currentPollQuestion, currentPollDescription, currentPollStartDate, '7 days', faker.datatype.boolean(), true);

		await Promise.all(currentPollOptions.map(async (option, index) =>
		{
			await db.query(`
				INSERT INTO poll_option (poll_id, description, sequence)
				VALUES ($1::int, $2, $3::int)
			`, currentPollResult.id, option, index + 1);
		}));
	}

	if (!previousPollId)
	{
		const previousPollQuestion = faker.lorem.sentence();
		const previousPollDescription = faker.datatype.boolean() ? faker.lorem.sentence() : null;

		const previousLastSunday = new Date(today);
		previousLastSunday.setDate(today.getDate() - today.getDay() - 7);
		const previousPollStartDate = dateUtils.formatYearMonthDay(previousLastSunday) + ' 05:00:00';

		const previousPollOptions = Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => faker.lorem.word());

		const [previousPollResult] = await db.query(`
			INSERT INTO poll (question, description, start_date, duration, is_multiple_choice, is_enabled)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`, previousPollQuestion, previousPollDescription, previousPollStartDate, '7 days', faker.datatype.boolean(), true);

		await Promise.all(previousPollOptions.map(async (option, index) =>
		{
			const votes = faker.number.int({ min: 0, max: 100 });

			await db.query(`
				INSERT INTO poll_option (poll_id, description, sequence, votes)
				VALUES ($1::int, $2, $3::int, $4)
			`, previousPollResult.id, option, index + 1, votes);
		}));
	}

	return {
		_success: 'Polls have been added to the homepage!',
	};
}

polls.permissions = [
	'TEST_SITE',
];

export default polls;
