import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, AdoptionTotalsType } from '@types';

/*
 * Adoption totals for scouts.
 */
export default async function totals(this: APIThisType) : Promise<AdoptionTotalsType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'adoption-reassign'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const totals = await db.query(`
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

	return await Promise.all(totals.map(async (total:any) => {
		return {
			scout: await this.query('v1/user', {id: total.scout_id}),
			total: Number(total.count),
		};
	}));
}