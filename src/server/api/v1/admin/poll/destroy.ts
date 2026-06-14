import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	// Confirm not expired
	const [poll] = await db.query(`
		SELECT now() > poll.start_date + poll.duration AS expired
		FROM poll
		WHERE id = $1::int
	`, id);

	if (poll.expired)
	{
		throw new UserError('poll-expired');
	}

	await db.query(`
		DELETE FROM poll
		WHERE id = $1::int
	`, id);
}

destroy.permissions = [
	'polls-admin',
];

destroy.apiTypes = {
	id: {
		type: APITypes.pollId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
