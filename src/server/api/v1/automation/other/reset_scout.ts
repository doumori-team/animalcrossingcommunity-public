import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Reset a new member's Scout
 */

async function reset_scout(this: APIThisType, { username }: resetScoutProps): Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters

	const [user] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE LOWER(username) = LOWER($1)
	`, username);

	if (!user)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries
	const [adoption] = await db.query(`
		SELECT node_id
		FROM adoption
		WHERE adoptee_id = $1::int
	`, user.id);

	if (!adoption)
	{
		throw new UserError('bad-format');
	}

	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				DELETE FROM user_group_node_permission
				WHERE node_id = $1::int
			`, adoption.node_id),
			query(`
				DELETE FROM user_node_permission
				WHERE node_id = $1::int AND user_id = $2::int
			`, adoption.node_id, user.id),
			query(`
				DELETE FROM user_node_permission
				WHERE node_id = $1::int AND user_id = $2::int
			`, constants.boardIds.adopteeBT, user.id),
			query(`
				DELETE FROM node_revision
				WHERE node_id = $1::int
			`, adoption.node_id),
			query(`
				DELETE FROM node_revision
				WHERE id = $1::int
			`, adoption.node_id),
			query(`
				DELETE FROM adoption
				WHERE adoptee_id = $1::int
			`, user.id),
		]);
	});

	return {
		_success: `The user has had their scout removed!`,
	};
}

reset_scout.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
};

type resetScoutProps = {
	username: string
};

export default reset_scout;
