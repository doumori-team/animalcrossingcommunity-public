import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

/*
 * Add missed bells, by type, to your account
 */
async function miss({type})
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Perform queries

	const amount = type === 'jackpot' ? await this.query('v1/treasure/jackpot') : Number(type);

	if (amount > 0)
	{
		await db.query(`
			INSERT INTO treasure_offer (user_id, bells, type, offer)
			VALUES ($1::int, $2::int, $3, (now() - interval '1 minute' * $4))
		`, this.userId, amount, type === 'jackpot' ? 'jackpot' : 'amount', constants.bellThreshold+10);
	}

	const [user] = await Promise.all([
		this.query('v1/user', {id: this.userId}),
		db.regenerateTopBells({userId: this.userId}),
	]);

	return {
		_success: `Oh no! You've missed ${user.missedBells} Bells!`,
		_callbackFirst: true,
	};
}

miss.apiTypes = {
	type: {
		type: APITypes.string,
		required: true,
		includes: ['100', '1000', '10000', 'jackpot'],
	},
}

export default miss;