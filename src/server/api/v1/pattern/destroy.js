import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const [modifyPatterns, processUserTickets] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-patterns'}),
		this.query('v1/permission', {permission: 'process-user-tickets'}),
	]);

	if (!(modifyPatterns || processUserTickets))
	{
		throw new UserError('permission');
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
}

destroy.apiTypes = {
	id: {
		type: APITypes.patternId,
	},
}

export default destroy;