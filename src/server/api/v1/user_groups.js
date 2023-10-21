import * as db from '@db';
import * as APITypes from '@apiTypes';

/*
 * Get all user groups.
 *
 * parameters:
 *  display - string - whether to display in a recursive manner (needed for permissions admin)
 */

async function user_groups({display})
{
	const userGroups = await db.query(`
		SELECT
			user_group.id,
			user_group.identifier,
			user_group.name,
			user_group.parent_id
		FROM user_group
	`);

	if (display !== 'recursive')
	{
		return userGroups;
	}

	return getChildGroups(userGroups, null);
}

/*
 * Recursively get children groups of each group.
 */
function getChildGroups(userGroups, parentId)
{
	return userGroups
		.filter(ug => ug.parent_id === parentId)
		.map(userGroup => {
		return {
			id: userGroup.id,
			identifier: userGroup.identifier,
			name: userGroup.name,
			groups: getChildGroups(userGroups, userGroup.id),
		};
	});
}

user_groups.apiTypes = {
	display: {
		type: APITypes.string,
	},
}

export default user_groups;
