import * as db from '@db';
import { dateUtils } from '@utils';

export default async function visitor()
{
	await db.query(`
		INSERT INTO site_statistic_data (site_statistic_id, number, date)
		VALUES (1, 1, $1)
		ON CONFLICT (site_statistic_id, date) DO UPDATE SET number = site_statistic_data.number + 1
	`, dateUtils.formatCurrentDateYearMonthDay());
}