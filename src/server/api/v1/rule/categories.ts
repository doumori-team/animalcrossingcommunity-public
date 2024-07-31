import * as db from '@db';
import { APIThisType, RuleCategoryType } from '@types';

export default async function categories(this: APIThisType) : Promise<RuleCategoryType[]>
{
	return await db.query(`
		SELECT
			rule_category.id,
			rule_category.name
		FROM rule_category
		ORDER BY rule_category.id ASC
	`);
}