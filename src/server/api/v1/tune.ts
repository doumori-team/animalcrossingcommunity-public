import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { dateUtils } from '@utils';
import { APIThisType, TuneType } from '@types';

async function tune(this: APIThisType, { id }: tuneProps): Promise<TuneType>
{
	const [tune] = await db.query(`
		SELECT
			town_tune.id,
			town_tune.name,
			town_tune.creator_id,
			encode(town_tune.notes, 'escape') AS notes,
			town_tune.created
		FROM town_tune
		WHERE town_tune.id = $1::int
	`, id);

	if (!tune)
	{
		throw new UserError('no-such-tune');
	}

	return <TuneType>{
		id: tune.id,
		name: tune.name,
		creator: await this.query('v1/user_lite', { id: tune.creator_id }),
		notes: tune.notes.match(/.{4}/g).map((hex: string) => parseInt(hex, 16)),
		formattedDate: dateUtils.formatDateTime5(tune.created),
	};
}

tune.permissions = [
	'view-towns',
	'use-trading-post',
	'view-tunes',
];

tune.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type tuneProps = {
	id: number
};

export default tune;
