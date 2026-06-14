import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, AdoptionTotalsType } from '@types';

/*
 * Adoption totals for scouts.
 */
async function totals(this: APIThisType): Promise<AdoptionTotalsType[]>
{
	const totals: { scout_id: number, count: number }[] = await db.query(`
		SELECT
			users.id AS scout_id,
			(
				SELECT count(*)
				FROM adoption
				WHERE adoption.scout_id = users.id AND
					adoption.adopted > (now() - interval '1 day' * $1)
			) AS count
		FROM users
		JOIN user_group ON (users.user_group_id = user_group.id)
		WHERE user_group.identifier = 'scout'
	`, constants.scoutHub.newMemberEligibility);

	return await Promise.all(totals.map(async total =>
	{
		return {
			scout: await this.query('v1/user', { id: total.scout_id }),
			total: Number(total.count),
		};
	}));
}

totals.permissions = [
	'adoption-reassign',
];

export default totals;
