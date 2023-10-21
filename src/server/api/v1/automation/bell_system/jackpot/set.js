import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function set({amount})
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

	// Check parameters
	if (amount % 100 !== 0)
	{
		throw new UserError('bells-not-divisable');
	}

	// Perform queries

	await db.query(`
		DELETE FROM treasure_offer
		WHERE offer < (now() - interval '1 minute' * $1) AND redeemed_user_id IS NULL AND type = 'amount'
	`, constants.bellThreshold);

	// we use ACC's id here so if the current user claims the jackpot it won't double-dip
	await db.query(`
		INSERT INTO treasure_offer (user_id, bells, type, offer)
		VALUES ($1::int, $2::int, $3, (now() - interval '1 minute' * $4))
	`, constants.accUserId, amount*20, 'amount', constants.bellThreshold+10);

	// this is for testing missed bells, and it's possible that there will be other
	// users treasure that are deleted above, but we really just care about our own
	// so just update stats for us (and the test account above)

	await Promise.all([
		this.query('v1/treasure/stats', {userId: constants.accUserId}),
		this.query('v1/treasure/stats', {userId: this.userId}),
	]);

	return {
		_success: `The jackpot has been set to ${amount.toLocaleString()} Bells!`,
		_callbackFirst: true,
	};
}

set.apiTypes = {
	amount: {
		type: APITypes.number,
		required: true,
		max: 500000,
		min: 1,
	},
}

export default set;