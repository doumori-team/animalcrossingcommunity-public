import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

/*
 * Update treasure stats for user.
 */
async function stats({userId})
{
	const [[totalBells], [missedBells], [totalJackpotBells], [jackpotsFound], [jackpotsMissed]] = await Promise.all([
		db.query(`
			SELECT
				coalesce(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 and redeemed_user_id = user_id
		`, userId),
		db.query(`
			SELECT
				coalesce(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1::int AND (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND offer < (now() - interval '1 minute' * $2)
		`, userId, constants.bellThreshold),
		db.query(`
			SELECT
				coalesce(sum(bells), 0) AS bells
			FROM treasure_offer
			WHERE user_id = $1 and redeemed_user_id = user_id AND type = 'jackpot'
		`, userId),
		db.query(`
			SELECT
				count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 and redeemed_user_id = user_id AND type = 'jackpot'
		`, userId),
		db.query(`
			SELECT
				count(*) AS jackpots
			FROM treasure_offer
			WHERE user_id = $1 and (redeemed_user_id != user_id OR redeemed_user_id IS NULL) AND type = 'jackpot'
		`, userId),
	]);

	await db.query(`
		INSERT INTO top_bell (user_id, total_bells, missed_bells, total_jackpot_bells, jackpots_found, jackpots_missed)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			total_bells = EXCLUDED.total_bells,
			missed_bells = EXCLUDED.missed_bells,
			total_jackpot_bells = EXCLUDED.total_jackpot_bells,
			jackpots_found = EXCLUDED.jackpots_found,
			jackpots_missed = EXCLUDED.jackpots_missed
	`, userId, totalBells.bells, missedBells.bells, totalJackpotBells.bells, jackpotsFound.jackpots, jackpotsMissed.jackpots);
}

stats.apiTypes = {
	userId: {
		type: APITypes.userId,
		required: true,
		default: true,
	},
}

export default stats;