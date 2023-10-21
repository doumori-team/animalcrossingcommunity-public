import * as db from '@db';

export default async function donations()
{
	return await db.query(`
		SELECT
			user_donation.user_id AS id,
			user_account_cache.username,
			SUM(user_donation.donation) AS donations
		FROM user_donation
		JOIN user_account_cache ON (user_donation.user_id = user_account_cache.id)
		GROUP BY user_donation.user_id, user_account_cache.username
		HAVING SUM(user_donation.donation) > 1
		ORDER BY donations DESC
	`);
}