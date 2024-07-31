import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, UserGroupType } from '@types';

/*
 * Get all user groups.
 *
 * parameters:
 *  display - string - whether to display in a recursive manner (needed for permissions admin)
 */
async function user_groups(this: APIThisType, {display}: userGroupsProps): Promise<UserGroupType[]>
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
function getChildGroups(userGroups:any, parentId:number|null)
{
	return userGroups
		.filter((ug:any) => ug.parent_id === parentId)
		.map((userGroup:any) => {
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

type userGroupsProps = {
	display?: 'recursive'
}

export default user_groups;
