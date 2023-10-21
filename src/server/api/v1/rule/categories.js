import * as db from '@db';

export default async function categories()
{
	return await db.query(`
		SELECT
			rule_category.id,
			rule_category.name
		FROM rule_category
		ORDER BY rule_category.id ASC
	`);
}