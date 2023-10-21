import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

async function save({user, action})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const userLite = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(userLite) === 'undefined' || userLite.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const userBlock = await this.query('v1/user', {username: user});

	if (typeof(userBlock) === 'undefined' || userBlock.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if ([
		constants.staffIdentifiers.owner,
		constants.staffIdentifiers.admin,
		constants.staffIdentifiers.mod,
		constants.staffIdentifiers.researcherTL,
		constants.staffIdentifiers.researcher,
		constants.staffIdentifiers.devTL,
		constants.staffIdentifiers.dev,
		constants.staffIdentifiers.scout,
	].includes(userBlock.group.identifier))
	{
		throw new UserError('cannot-block-user');
	}

	const blockUserId = Number(userBlock.id);

	if (blockUserId === this.userId)
	{
		throw new UserError('bad-format');
	}

	// Check if user already has whitelisted user
	await db.transaction(async query =>
	{
		const [checkId] = await query(`
			SELECT user_id, block_user_id
			FROM block_user
			WHERE user_id = $1::int AND block_user_id = $2::int
		`, this.userId, blockUserId);

		// Perform queries
		if (checkId)
		{
			if (action === 'remove')
			{
				await query(`
					DELETE FROM block_user
					WHERE user_id = $1::int AND block_user_id = $2::int
				`, checkId.user_id, checkId.block_user_id);
			}

			return;
		}
		else if (action === 'remove')
		{
			return;
		}

		await query(`
			INSERT INTO block_user (user_id, block_user_id)
			VALUES ($1::int, $2::int)
		`, this.userId, blockUserId);
	});
}

save.apiTypes = {
	user: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	action: {
		type: APITypes.string,
		includes: ['add', 'remove'],
		required: true,
	},
}

export default save;