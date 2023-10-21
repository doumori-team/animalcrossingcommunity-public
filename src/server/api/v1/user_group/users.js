import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { UserError } from '@errors';

/*
 * Get all users in a specific user group.
 */
async function users({group})
{
	if ([constants.groupIdentifiers.user, constants.staffIdentifiers.exStaff].includes(group))
	{
		throw new UserError('bad-format');
	}

	const userIds = await db.query(`
		SELECT
			users.id
		FROM users
		JOIN user_group ON (users.user_group_id = user_group.id)
		WHERE user_group.identifier = $1
	`, group);

	if (userIds.length === 0)
	{
		return [];
	}

	const users = await Promise.all(userIds.map(async(user) => {
		return this.query('v1/user', {id: user.id})
	}));

	return users.sort((a, b) => a.username.localeCompare(b.username));
}

users.apiTypes = {
	group: {
		type: APITypes.string,
		default: '',
		required: true,
	},
}

export default users;