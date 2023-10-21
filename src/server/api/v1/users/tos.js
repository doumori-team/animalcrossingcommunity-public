import * as db from '@db';
import { UserError } from '@errors';

/*
 * Accept the TOS.
 */
export default async function tos()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	await db.query(`
		UPDATE users
		SET tos_date = now()
		WHERE id = $1::int
	`, this.userId);
}