import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [userAvatar] = await db.query(`
		SELECT user_avatar.user_id
		FROM user_avatar
		WHERE user_avatar.id = $1
	`, id);

	if (!userAvatar)
	{
		throw new UserError('bad-format');
	}

	if (userAvatar.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	await db.query(`
		DELETE FROM user_avatar
		WHERE id = $1
	`, id);
}

destroy.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
