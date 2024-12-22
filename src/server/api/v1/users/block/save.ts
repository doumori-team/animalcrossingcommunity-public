import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, UserType } from '@types';

async function save(this: APIThisType, { user, action }: saveProps): Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	await this.query('v1/user_lite', { id: this.userId });

	const userBlock: UserType = await this.query('v1/user', { username: user });

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
	await db.transaction(async (query: any) =>
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
};

type saveProps = {
	user: string
	action: 'add' | 'remove'
};

export default save;
