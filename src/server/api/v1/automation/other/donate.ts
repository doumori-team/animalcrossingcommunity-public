import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType, UserDonationsType } from '@types';

/*
 * Add / Remove donations to yourself.
 */
async function donate(this: APIThisType, { donateAction, amount }: donateProps): Promise<SuccessType>
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
	if (donateAction === 'remove')
	{
		await db.query(`
			UPDATE user_donation SET donated = now() - interval '2 year' WHERE user_id = $1
		`, this.userId);
	}
	else if (amount > 0)
	{
		await db.query(`
			INSERT INTO user_donation (user_id, donation)
			VALUES ($1::int, $2::int)
		`, this.userId, amount);
	}

	ACCCache.deleteMatch(constants.cacheKeys.donations);

	if (donateAction === 'add')
	{
		const updatedUser: UserDonationsType = await this.query('v1/users/donations', { id: this.userId });

		return {
			_success: `You have donated ${amount.toLocaleString()}, bringing your total to ${updatedUser.donations}!`,
			_callbackFirst: true,
		};
	}

	return {
		_success: `Your donations has been changed to have been donated more then 1 year ago.`,
		_callbackFirst: true,
	};
}

donate.apiTypes = {
	donateAction: {
		type: APITypes.string,
		includes: ['add', 'remove'],
		required: true,
	},
	amount: {
		type: APITypes.number,
		required: true,
		max: 10000000,
		min: 1,
	},
};

type donateProps = {
	donateAction: 'add' | 'remove'
	amount: number
};

export default donate;
