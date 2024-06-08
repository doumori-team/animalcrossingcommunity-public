import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function save({buddyUsers, action})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-buddy-system'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	if (!Array.isArray(buddyUsers))
	{
		if (buddyUsers)
		{
			if (utils.realStringLength(buddyUsers) > constants.max.addMultipleUsers)
			{
				throw new UserError('bad-format');
			}

			buddyUsers = buddyUsers.split(',').map(username => username.trim());
		}
		else
		{
			buddyUsers = [];
		}
	}

	let buddyUserIds = await Promise.all(buddyUsers.map(async (username) =>
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
		const userDonations = await this.query('v1/users/donations', {id: this.userId});

		// Check how many buddies user currently has
		const [buddyCount] = await db.query(`
			SELECT count(*) AS count
			FROM user_buddy
			WHERE user_id = $1::int
		`, this.userId);

		if (
			(userDonations.perks < 10 && buddyCount.count >= 100) ||
			(userDonations.perks < 20 && buddyCount.count >= 200)
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
	};
}

save.apiTypes = {
	// buddyUsers custom check above
	action: {
		type: APITypes.string,
		default: '',
		required: true,
		includes: ['add', 'remove'],
	},
}

export default save;