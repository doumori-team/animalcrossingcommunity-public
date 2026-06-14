import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, UserType } from '@types';

/*
 * Add missed bells, by type, to your account
 */
async function miss(this: APIThisType, { type }: missProps): Promise<SuccessType>
{
	// Perform queries

	const amount: number = type === 'jackpot' ? await this.query('v1/treasure/jackpot') : Number(type);

	if (amount > 0)
	{
		await db.query(`
			INSERT INTO treasure_offer (user_id, bells, type, offer)
			VALUES ($1::int, $2::int, $3, (now() - interval '1 minute' * $4))
		`, this.userId, amount, type === 'jackpot' ? 'jackpot' : 'amount', constants.bellThreshold + 10);
	}

	const [user]: [UserType, void] = await Promise.all([
		this.query('v1/user', { id: this.userId }),
		db.regenerateTopBells({ userId: this.userId as number }),
	]);

	return {
		_success: `Oh no! You've missed ${user.missedBells} Bells!`,
	};
}

miss.permissions = [
	'TEST_SITE',
	'userId',
];

miss.apiTypes = {
	type: {
		type: APITypes.string,
		required: true,
		includes: ['100', '1000', '10000', 'jackpot'],
	},
};

type missProps = {
	type: '100' | '1000' | '10000' | 'jackpot'
};

export default miss;
