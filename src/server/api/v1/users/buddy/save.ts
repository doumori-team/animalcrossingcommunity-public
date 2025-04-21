import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType, UserDonationsType } from '@types';

async function save(this: APIThisType, { buddyUsers, action }: saveProps): Promise<SuccessType | boolean>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-buddy-system' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	let buddyUserIds = await Promise.all(buddyUsers.map(async (username: string) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (buddyUsers.length > 1)
		{
			if (!check || check.id === this.userId)
			{
				return null;
			}
		}
		else
		{
			if (!check)
			{
				throw new UserError('no-such-user');
			}

			if (check.id === this.userId)
			{
				throw new UserError('bad-format');
			}
		}

		return Number(check.id);
	}));

	buddyUserIds = buddyUserIds.filter(id => id !== null);

	if (buddyUserIds.length === 0)
	{
		return true;
	}

	if (action === 'add')
	{
		const userDonations: UserDonationsType = await this.query('v1/users/donations', { id: this.userId });

		// Check how many buddies user currently has
		const [buddyCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_buddy
			WHERE user_id = $1::int
		`, this.userId);

		if (
			userDonations.perks < 10 && buddyCount.count >= 100 ||
			userDonations.perks < 20 && buddyCount.count >= 200
		)
		{
			throw new UserError('max-buddies');
		}
	}

	// Perform queries

	if (action === 'add')
	{
		await db.query(`
			INSERT INTO user_buddy (user_id, buddy_user_id)
			SELECT $1::int, unnest($2::int[])
			ON CONFLICT (user_id, buddy_user_id) DO NOTHING
		`, this.userId, buddyUserIds);
	}
	else if (action === 'remove')
	{
		await db.query(`
			DELETE FROM user_buddy
			WHERE user_id = $1::int AND buddy_user_id = ANY($2::int[])
		`, this.userId, buddyUserIds);
	}

	return {
		_successImage: `${constants.AWS_URL}/images/icons/icon_check.png`,
		_success: `You have updated your buddy list.`,
	};
}

save.apiTypes = {
	buddyUsers: {
		type: APITypes.array,
		length: constants.max.addMultipleUsers,
	},
	action: {
		type: APITypes.string,
		default: '',
		required: true,
		includes: ['add', 'remove'],
	},
};

type saveProps = {
	buddyUsers: string[]
	action: 'add' | 'remove'
};

export default save;
