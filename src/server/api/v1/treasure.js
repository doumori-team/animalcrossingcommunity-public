import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';

/*
 * Determines if user gets treasure.
 */
export default async function treasure()
{
	if (!this.userId)
	{
		return 0;
	}

	const user = await this.query('v1/user', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (user.reviewTOS)
	{
		return 0;
	}

	const odds = 1.0 / 30;
	const thousand = 15 / 100.0;
	const fiveThousand = 8 / 100.0;
	const tenThousand = 2 / 100.0;
	let jackpot = 1 / 25000.0;
	let wisp = 1 / 100.0;

	const [treasureOffer] = await db.query(`
		SELECT
			id
		FROM treasure_offer
		WHERE user_id = $1::int AND offer > (now() - interval '1 minute' * $2)
	`, this.userId, constants.bellThreshold);

	if (treasureOffer)
	{
		return 0;
	}

	if (Math.random() >= odds)
	{
		return 0;
	}

	const [jackpotAmount, [missedBells]] = await Promise.all([
		this.query('v1/treasure/jackpot'),
		db.query(`
			SELECT
				count(*) AS count
			FROM treasure_offer
			WHERE user_id = $1::int AND redeemed_user_id IS NULL AND type = 'amount'
		`, this.userId),
	]);

	jackpot = jackpot * Math.pow(2, (jackpotAmount/10000.0)-1);
	wisp = wisp * Math.pow(1.75, (jackpotAmount/10000.0)-1);

	let treasureType = 'amount', bells = 100, treasureTypeId = 1;
	const dice = Math.random();

	if (dice < jackpot)
	{
		treasureType = 'jackpot';
		bells = 0;
		treasureTypeId = 4;
	}
	else if (dice >= jackpot && dice <= (jackpot + tenThousand))
	{
		bells = 10000;
		treasureTypeId = 3;
	}
	else if (dice >= (jackpot + tenThousand) && dice <= (jackpot + tenThousand + fiveThousand))
	{
		bells = 5000;
		treasureTypeId = 6;
	}
	else if (dice >= (jackpot + fiveThousand + tenThousand) && dice <= (jackpot + tenThousand + fiveThousand + thousand))
	{
		bells = 1000;
		treasureTypeId = 2;
	}
	else if ((dice >= (jackpot + fiveThousand + tenThousand + thousand) && dice <= (jackpot + tenThousand + fiveThousand + thousand + wisp)) && missedBells.count > 0)
	{
		treasureType = 'wisp';
		bells = 0;
		treasureTypeId = 5;
	}

	const [offer] = await db.query(`
		INSERT INTO treasure_offer (user_id, bells, type)
		VALUES ($1::int, $2::int, $3)
		RETURNING id
	`, this.userId, bells, treasureType);

	await Promise.all([
		this.query('v1/treasure/stats', {userId: this.userId}),
	]);

	return {
		treasureTypeId,
		id: offer.id,
	};
}