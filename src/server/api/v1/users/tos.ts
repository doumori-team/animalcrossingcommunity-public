import * as db from '@db';
import { APIThisType } from '@types';

/*
 * Accept the TOS.
 */
async function tos(this: APIThisType): Promise<void>
{
	await db.query(`
		UPDATE users
		SET tos_date = now()
		WHERE id = $1::int
	`, this.userId);
}

tos.permissions = [
	'userId',
];

export default tos;
