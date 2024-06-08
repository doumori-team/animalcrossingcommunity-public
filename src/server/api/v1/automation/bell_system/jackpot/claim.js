import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';

/*
 * Claim jackpot for yourself.
 */
export default async function claim()
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

	const bells = await this.query('v1/treasure/jackpot');

	await db.query(`
		INSERT INTO treasure_offer (user_id, bells, type, redeemed_user_id)
		VALUES ($1::int, $2::int, $3, $1::int)
	`, this.userId, bells, 'jackpot');

	await db.query(`
		UPDATE treasure_offer
		SET redeemed_user_id = $1::int
		WHERE offer < (now() - interval '1 minute' * $2) AND redeemed_user_id IS NULL AND type = 'amount'
	`, this.userId, constants.bellThreshold);

	await db.query(`
		UPDATE site_setting
		SET updated = now()
		WHERE id = 4
	`);

	await query(`
		REFRESH MATERIALIZED VIEW top_bell_last_jackpot
	`);

	await db.regenerateTopBells({userId: this.userId});

	const [user] = await Promise.all([
		this.query('v1/user', {id: this.userId}),
	]);

	return {
		_success: `Congratulations! You have won the JACKPOT, bringing your total to ${user.bells} Bells!`,
		_callbackFirst: true,
	};
}