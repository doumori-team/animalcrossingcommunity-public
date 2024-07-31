import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, UserType } from '@types';

/*
 * Add / Remove bells to yourself.
 */
async function bells(this: APIThisType, {action, amount}: bellsProps) : Promise<SuccessType>
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
	let showBells:number|string = amount;

	if (action === 'remove')
	{
		const user:UserType = await this.query('v1/user', {id: this.userId});

		amount = user.nonFormattedTotalBells - amount;

		if (amount < 0)
		{
			amount = 0;
			showBells = user.bells;
		}

		await db.query(`
			DELETE FROM treasure_offer WHERE user_id = $1::int
		`, this.userId);
	}

	if (amount > 0)
	{
		await db.query(`
			INSERT INTO treasure_offer (user_id, bells, type, redeemed_user_id)
			VALUES ($1::int, $2::int, $3, $1::int)
		`, this.userId, amount, 'amount');
	}

	await db.regenerateTopBells({userId: this.userId});

	const [updatedUser] = await Promise.all([
		this.query('v1/user', {id: this.userId}),
	]);

	if (action === 'add')
	{
		return {
			_success: `Congratulations! You have redeemed your ${amount.toLocaleString()} Bells, bringing your total to ${updatedUser.bells} Bells!`,
			_callbackFirst: true,
		};
	}
	else
	{
		return {
			_success: `Oh no! You have lost ${showBells.toLocaleString()} Bells, bringing your total to ${updatedUser.bells} Bells!`,
			_callbackFirst: true,
		};
	}
}

bells.apiTypes = {
	action: {
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
}

type bellsProps = {
	action: 'add' | 'remove'
	amount: number
}

export default bells;