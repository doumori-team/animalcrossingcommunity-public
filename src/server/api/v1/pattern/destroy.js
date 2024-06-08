import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-patterns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [pattern] = await db.query(`
		SELECT creator_id
		FROM pattern
		WHERE pattern.id = $1::int
	`, id);

	if (pattern.creator_id != this.userId)
	{
		throw new UserError('permission');
	}

	await db.transaction(async query =>
	{
		await Promise.all([
			query(`
				UPDATE town
				SET flag_id = NULL
				WHERE flag_id = $1::int
			`, id),
			query(`
				DELETE FROM pattern
				WHERE id = $1::int
			`, id),
		]);
	});

	ACCCache.deleteMatch(constants.cacheKeys.patterns);
}

destroy.apiTypes = {
	id: {
		type: APITypes.patternId,
	},
}

export default destroy;