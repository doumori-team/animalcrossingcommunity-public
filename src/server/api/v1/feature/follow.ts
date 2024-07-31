import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function follow(this: APIThisType, {id}: followProps) : Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	const [feature] = await db.query(`
		SELECT id
		FROM feature
		WHERE id = $1::int
	`, id);

	if (!feature)
	{
		throw new UserError('no-such-feature');
	}

	const [followed] = await db.query(`
		SELECT feature_id
		FROM followed_feature
		WHERE user_id = $1::int AND feature_id = $2::int
	`, this.userId, id);

	if (followed)
	{
		await db.query(`
			DELETE FROM followed_feature
			WHERE user_id = $1::int AND feature_id = $2::int
		`, this.userId, id);

		return;
	}

	await db.query(`
		INSERT INTO followed_feature (user_id, feature_id)
		VALUES ($1, $2)
	`, this.userId, id);
}

follow.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type followProps = {
	id: number
}

export default follow;