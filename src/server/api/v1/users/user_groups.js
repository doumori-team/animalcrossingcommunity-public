import * as db from '@db';
import * as APITypes from '@apiTypes';

/*
 * Get all user group ids for user.
 */
async function user_groups({userId})
{
	if (!userId)
	{
		return [0];
	}

	let [groupId] = await db.query(`
		SELECT users.user_group_id
		FROM users
		WHERE users.id = $1::int
	`, userId);

	groupId = groupId.user_group_id;

	let groupIds = [groupId];

	do
	{
		const [parentGroup] = await db.query(`
			SELECT parent_id
			FROM user_group
			WHERE id = $1::int
		`, groupId);

		groupId = parentGroup.parent_id;

		if (groupId !== null)
		{
			groupIds.push(groupId);
		}
	} while (groupId !== null);

	return groupIds;
}

user_groups.apiTypes = {
	userId: {
		type: APITypes.userId,
		nullable: true,
		default: true,
	},
}

export default user_groups;