import * as db from '@db';
import { UserError } from '@errors';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

export default async function publish(this: APIThisType) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	await db.transaction(async (query:any) =>
	{
		// expire any rules that are being expired
		await query(`
			UPDATE rule
			SET pending_expiration = false, expiration_date = now()
			WHERE pending_expiration = true
		`);

		// expire any violations that are being expired
		// (when a rule is expired, all its violations are marked as expired)
		await query(`
			UPDATE rule_violation
			SET pending_expiration = false, expiration_date = now()
			WHERE pending_expiration = true
		`);

		// copy over un-expired not-modified violations from the original to the modified rule

		// get all un-expired violations from original rules that have been modified
		const currentViolations = await query(`
			SELECT rule_violation.id, rule.id AS rule_id, rule_violation.severity_id, rule_violation.number, rule_violation.violation
			FROM rule_violation
			JOIN rule ON (rule_violation.rule_id = rule.original_rule_id)
			WHERE rule.start_date IS NULL AND rule_violation.expiration_date IS NULL
		`);

		await Promise.all(currentViolations.map(async (violation:any) => {
			// only copy over those that haven't been modified
			const [modifiedViolation] = await query(`
				SELECT id
				FROM rule_violation
				WHERE original_violation_id = $1::int AND start_date IS NULL
			`, violation.id);

			if (!modifiedViolation)
			{
				await query(`
					INSERT INTO rule_violation (rule_id, severity_id, number, violation, start_date)
					VALUES ($1::int, $2::int, $3::int, $4, now())
				`, violation.rule_id, violation.severity_id, violation.number, violation.violation);
			}
		}));

		// expire any rules that have been modified
		await query(`
			UPDATE rule
			SET expiration_date = now()
			WHERE id IN (SELECT original_rule_id FROM rule WHERE original_rule_id IS NOT NULL and start_date IS NULL)
		`);

		// expire any violations where their rule has been modified
		await query(`
			UPDATE rule_violation
			SET expiration_date = now()
			WHERE rule_id IN (SELECT original_rule_id FROM rule WHERE original_rule_id IS NOT NULL and start_date IS NULL)
		`);

		// expire any violations that have been modified
		await query(`
			UPDATE rule_violation
			SET expiration_date = now()
			WHERE id IN (SELECT original_violation_id FROM rule_violation WHERE original_violation_id IS NOT NULL and start_date IS NULL)
		`);

		// set all new / modified rules to be now a current rule
		await query(`
			UPDATE rule
			SET start_date = now()
			WHERE start_date IS NULL
		`);

		// update the rule start date for any violations that have been added / modified
		// this is because the rules start date indicates whether a rule has been updated to the user
		await query(`
			UPDATE rule
			SET start_date = now()
			WHERE id IN (SELECT rule_id FROM rule_violation WHERE start_date IS NULL)
		`);

		// set all new / modified violations to be now a current violation
		await query(`
			UPDATE rule_violation
			SET start_date = now()
			WHERE start_date IS NULL
		`);

		await query(`
			UPDATE site_setting
			SET updated = now()
			WHERE name = 'Rules'
		`);
	});

	ACCCache.deleteMatch(constants.cacheKeys.rulesCurrent);
}