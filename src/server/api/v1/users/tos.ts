import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType } from '@types';

/*
 * Accept the TOS.
 */
export default async function tos(this: APIThisType)
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await db.query(`
		UPDATE users
		SET tos_date = now()
		WHERE id = $1::int
	`, this.userId);
}
