import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, UserType, SuccessType } from '@types';

async function save(this: APIThisType, { userId, groupId }: saveProps): Promise<SuccessType>
{
	// Confirm perms
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'permission-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Confirm params
	const user: UserType = await this.query('v1/user', { id: userId });

	const [checkId] = await db.query(`
		SELECT
			user_group.identifier
		FROM user_group
		WHERE user_group.id = $1::int
	`, groupId);

	if (!checkId)
	{
		throw new UserError('no-such-user-group');
	}

	// Only owner can change owner perms
	if ([user.group.identifier, checkId.identifier].includes(constants.staffIdentifiers.owner))
	{
		const currentUser: UserType = await this.query('v1/user', { id: this.userId });

		if (currentUser.group.identifier !== 'owner')
		{
			throw new UserError('change-owner-perms-restricted');
		}
	}

	// Perform queries

	await db.query(`
		UPDATE users
		SET user_group_id = $2::int
		WHERE id = $1::int
	`, user.id, groupId);

	// reset modmin avatar
	if ([constants.staffIdentifiers.owner, constants.staffIdentifiers.admin, constants.staffIdentifiers.mod].includes(user.group.identifier))
	{
		await db.query(`
			UPDATE users
			SET avatar_coloration_id = NULL, avatar_character_id = NULL, avatar_background_id = NULL, avatar_accent_id = NULL
			WHERE id = $1::int
		`, user.id);
	}

	ACCCache.deleteMatch(constants.cacheKeys.userGroupUsers);

	return {
		_success: `The user's group has been updated.`,
	};
}

save.apiTypes = {
	userId: {
		type: APITypes.userId,
		required: true,
	},
	groupId: {
		type: APITypes.number,
		default: 0,
	},
};

type saveProps = {
	userId: number
	groupId: number
};

export default save;
