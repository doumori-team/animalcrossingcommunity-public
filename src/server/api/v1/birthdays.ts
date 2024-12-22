import * as db from '@db';
import * as accounts from '@accounts';
import { APIThisType, BirthdaysType } from '@types';

/*
 * Get all users that have today as a birthday.
 */
export default async function birthdays(this: APIThisType): Promise<BirthdaysType[]>
{
	try
	{
		const birthdaysData = await accounts.getBirthdays();

		return await db.query(`
			SELECT
				users.id,
				user_account_cache.username
			FROM users
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE users.id = ANY($1) AND users.show_birthday = true AND users.last_active_time IS NOT NULL AND users.last_active_time > current_date - interval '30' day
		`, birthdaysData.map(d => d.id));
	}
	catch (error)
	{
		console.error(error);
	}

	return [];
}
