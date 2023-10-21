import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

async function claim({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'collect-bells'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [treasure] = await db.query(`
		SELECT
			user_id,
			offer <= (now() - interval '1 minute' * $2) AS expired,
			redeemed_user_id,
			type,
			bells
		FROM treasure_offer
		WHERE id = $1::int
	`, id, constants.bellThreshold);

	if (!treasure)
	{
		throw new UserError('no-such-treasure');
	}

	if (this.userId !== treasure.user_id)
	{
		throw new UserError('treasure-invalid-user');
	}

	if (treasure.redeemed_user_id !== null)
	{
		throw new UserError('treasure-redeemed');
	}

	if (treasure.expired)
	{
		throw new UserError('treasure-expired');
	}

	// Process
	let bells = 0;
	let showBells = treasure.bells;

	await db.transaction(async query =>
	{
		if (treasure.type === 'jackpot')
		{
			bells = await this.query('v1/treasure/jackpot');
			showBells = bells;

			await query(`
				UPDATE treasure_offer
				SET redeemed_user_id = $1::int
				WHERE offer < (now() - interval '1 minute' * $2) AND redeemed_user_id IS NULL AND type = 'amount'
			`, this.userId, constants.bellThreshold);

			await query(`
				UPDATE site_setting
				SET updated = now()
				WHERE id = 4
			`);
		}
		else if (treasure.type === 'wisp')
		{
			const [reclaimTreasure] = await query(`
				SELECT
					id,
					bells
				FROM treasure_offer
				WHERE user_id = $1::int AND redeemed_user_id IS NULL AND type = 'amount'
				ORDER BY id DESC
				LIMIT 1
			`, this.userId);

			showBells = reclaimTreasure.bells;

			await query(`
				UPDATE treasure_offer
				SET redeemed_user_id = $1::int
				WHERE id  = $2::int
			`, this.userId, reclaimTreasure.id);
		}

		await query(`
			UPDATE treasure_offer
			SET redeemed_user_id = $2::int
			WHERE id = $1::int
		`, id, this.userId);

		if (bells > 0)
		{
			await query(`
				UPDATE treasure_offer
				SET bells = $2::int
				WHERE id = $1::int
			`, id, bells);
		}
	});

	const [user] = await Promise.all([
		this.query('v1/user', {id: this.userId}),
		this.query('v1/treasure/stats', {userId: this.userId}),
	]);

	return {
		_success: `Congratulations! You have redeemed your ${showBells.toLocaleString()} Bells, bringing your total to ${user.bells} Bells!`
	};
}

claim.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default claim;