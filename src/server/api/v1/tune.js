import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { dateUtils } from '@utils';

async function tune({id})
{
	const [viewTownsPerm, useTradingPostPerm, viewTunesPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-towns'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'view-tunes'}),
	]);

	if (!(viewTownsPerm || useTradingPostPerm || viewTunesPerm))
	{
		throw new UserError('permission');
	}

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

	return {
		id: tune.id,
		name: tune.name,
		creator: await this.query('v1/user_lite', {id: tune.creator_id}),
		notes: tune.notes.match(/.{4}/g).map(hex => parseInt(hex, 16)),
		formattedDate: dateUtils.formatDateTimezone(tune.created),
	};
}

tune.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default tune;