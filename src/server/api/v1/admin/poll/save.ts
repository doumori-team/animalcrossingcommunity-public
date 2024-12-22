import * as db from '@db';
import { UserError } from '@errors';
import { utils, dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, question, description, startDate, duration,
	isMultipleChoice, isEnabled, options }: saveProps): Promise<{ id: number }>
{
	const permission: boolean = await this.query('v1/permission', { permission: 'polls-admin' });

	if (!permission)
	{
		throw new UserError('permission');
	}

	// Check parameters
	if (id != null && id > 0)
	{
		const [checkId] = await db.query(`
			SELECT now() > poll.start_date + poll.duration AS expired
			FROM poll
			WHERE id = $1::int
		`, id);

		// Polls shouldn't be editable if they've expired
		if (checkId.expired)
		{
			throw new UserError('poll-expired');
		}
	}

	startDate = dateUtils.formatYearMonthDay(startDate) + ' 05:00:00';

	const durationInterval = duration + ' days';

	options = await Promise.all(options.map(async option =>
	{
		if (utils.realStringLength(option) > constants.max.pollOption)
		{
			throw new UserError('bad-format');
		}

		let newOption = String(option);

		await this.query('v1/profanity/check', { text: newOption });

		return newOption;
	}));

	options = options.filter((sc) => /\S/.test(sc));

	if (options.length < 2)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	const pollResult = await db.transaction(async (query: any) =>
	{
		if (id != null && id > 0)
		{
			const [pollResult] = await query(`
				UPDATE poll
				SET question = $2, description = $3, start_date = $4, duration = $5, is_multiple_choice = $6, is_enabled = $7
				WHERE id = $1::int
				RETURNING id
			`, id, question, description, startDate, durationInterval, isMultipleChoice, isEnabled);

			const [lastInSequence] = await query(`
				SELECT
					MAX(sequence)
				FROM poll_option
				WHERE poll_id = $1::int
			`, id);

			await Promise.all(options.map(async (option, index) =>
			{
				if (index + 1 <= lastInSequence.max)
				{
					// Updates existing options
					await query(`
						UPDATE poll_option
						SET description = $2
						WHERE poll_id = $1::int AND sequence = $3::int
					`, id, option, index + 1);
				}
				else
				{
					// Adds newer options
					await query(`
						INSERT INTO poll_option (poll_id, description, sequence)
						VALUES ($1::int, $2, $3::int)
					`, id, option, index + 1);
				}
			}));

			// Deletes any extra options that may have previously existed
			if (options.length < lastInSequence.max)
			{
				await query(`
					DELETE FROM poll_option
					WHERE poll_id = $1::int AND sequence >= $2::int
				`, id, options.length + 1);
			}

			return pollResult;
		}
		else
		{
			const [pollResult] = await query(`
				INSERT INTO poll (question, description, start_date, duration, is_multiple_choice, is_enabled)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id
			`, question, description, startDate, durationInterval, isMultipleChoice, isEnabled);

			await Promise.all(options.map(async (option, index) =>
			{
				await query(`
					INSERT INTO poll_option (poll_id, description, sequence)
					VALUES ($1::int, $2, $3::int)
				`, pollResult.id, option, index + 1);
			}));

			return pollResult;
		}
	});

	return {
		id: pollResult.id,
	};
}

save.apiTypes = {
	id: {
		type: APITypes.pollId,
		nullable: true,
	},
	question: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-poll-question',
		length: constants.max.pollQuestion,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		length: constants.max.pollDescription,
		profanity: true,
		nullable: true,
	},
	startDate: {
		type: APITypes.date,
		required: true,
	},
	duration: {
		type: APITypes.number,
		default: 7,
		required: true,
		min: 1,
		max: constants.max.pollDuration,
	},
	isMultipleChoice: {
		type: APITypes.boolean,
		default: 'false',
	},
	isEnabled: {
		type: APITypes.boolean,
		default: 'false',
	},
	options: {
		type: APITypes.array,
	},
};

type saveProps = {
	id: number | null
	question: string
	description: string
	startDate: string
	duration: number
	isMultipleChoice: boolean
	isEnabled: boolean
	options: any[]
};

export default save;
