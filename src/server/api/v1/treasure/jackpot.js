import * as db from '@db';
import { constants } from '@utils';

/*
 * How much is in current jackpot.
 */
export default async function jackpot()
{
	const [jackpotAmount] = await db.query(`
		SELECT COALESCE((sum(bells) / 20), 0) AS amount
		FROM treasure_offer
		WHERE offer < (now() - interval '1 minute' * $1) AND redeemed_user_id IS NULL AND type = 'amount'
	`, constants.bellThreshold);

	return Number(jackpotAmount.amount);
}