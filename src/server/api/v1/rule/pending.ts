import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, PendingRuleType } from '@types';

export default async function pending(this: APIThisType): Promise<PendingRuleType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-rules-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [currentNewRules, currentViolations] = await Promise.all([
		db.query(`
			SELECT
				rule.id,
				rule.number,
				rule.name,
				rule.start_date,
				rule.description,
				rule.pending_expiration,
				rule_category.name AS category,
				rule.reportable
			FROM rule
			JOIN rule_category ON (rule.category_id = rule_category.id)
			WHERE rule.expiration_date IS NULL AND (rule.start_date IS NOT NULL OR (rule.start_date IS NULL AND rule.original_rule_id IS NULL))
			ORDER BY rule_category.id ASC, rule.number ASC
		`),
		db.query(`
			SELECT
				rule_violation.id,
				rule_violation.severity_id,
				rule_violation.violation,
				rule_violation.rule_id,
				rule_violation.start_date,
				rule_violation.pending_expiration
			FROM rule_violation
			JOIN rule ON (rule.id = rule_violation.rule_id)
			WHERE rule.expiration_date IS NULL AND rule_violation.expiration_date IS NULL AND rule_violation.start_date IS NOT NULL
			ORDER BY rule_violation.severity_id ASC, rule_violation.number ASC
		`),
	]);

	return await Promise.all(currentNewRules.map(async (rule: any) =>
	{
		const [[pendingRule], pendingNewExpiredViolations] = await Promise.all([
			db.query(`
				SELECT
					rule.id,
					rule.number,
					rule.name,
					rule.start_date,
					rule.description,
					rule_category.name AS category,
					rule.reportable
				FROM rule
				JOIN rule_category ON (rule.category_id = rule_category.id)
				WHERE rule.start_date IS NULL AND rule.original_rule_id = $1::int
			`, rule.id),
			db.query(`
				SELECT
					rule_violation.id,
					rule_violation.severity_id,
					rule_violation.violation,
					rule_violation.rule_id,
					rule_violation.pending_expiration,
					rule_violation.original_violation_id,
					rule_violation.start_date
				FROM rule_violation
				WHERE (rule_violation.start_date IS NULL OR rule_violation.pending_expiration = true) AND rule_violation.rule_id = $1::int
				ORDER BY rule_violation.severity_id ASC
			`, rule.id),
		]);

		const violations = currentViolations.filter((v: any) => v.rule_id === rule.id);

		let pendingViolationsList = [];

		if (pendingNewExpiredViolations.length > 0)
		{
			pendingViolationsList = violations.map((violation: any) =>
			{
				const pendingViolation = pendingNewExpiredViolations.find((v: any) => v.original_violation_id === violation.id || v.id === violation.id);

				return {
					id: violation.id,
					number: violation.number,
					severityId: violation.severity_id,
					violation: violation.violation,
					pendingExpiration: violation.pending_expiration,
					startDate: violation.start_date,
					pendingViolation: pendingViolation ? {
						id: pendingViolation.id,
						severityId: pendingViolation.severity_id,
						violation: pendingViolation.violation,
					} : null,
				};
			});

			pendingViolationsList = pendingViolationsList.concat(pendingNewExpiredViolations.filter((v: any) => v.original_violation_id == null && v.pending_expiration != true).map((violation: any) =>
			{
				return {
					id: violation.id,
					number: violation.number,
					severityId: violation.severity_id,
					violation: violation.violation,
					pendingExpiration: violation.pending_expiration,
					startDate: violation.start_date,
					pendingViolation: null,
				};
			}));

			pendingViolationsList.sort((a: any, b: any) => a.severityId - b.severityId || a.number - b.number);
		}

		return {
			id: rule.id,
			number: rule.number,
			name: rule.name,
			startDate: rule.start_date,
			description: rule.description,
			violations: violations.map((violation: any) =>
			{
				return {
					id: violation.id,
					severityId: violation.severity_id,
					violation: violation.violation,
					pendingExpiration: violation.pending_expiration,
					startDate: violation.start_date,
				};
			}),
			pendingExpiration: rule.pending_expiration,
			pendingRule: pendingRule ? {
				id: pendingRule.id,
				number: pendingRule.number,
				name: pendingRule.name,
				startDate: pendingRule.start_date,
				description: pendingRule.description,
				category: pendingRule.category,
				reportable: pendingRule.reportable,
			} : null,
			pendingViolations: pendingViolationsList,
			category: rule.category,
			reportable: rule.reportable,
		};
	}));
}
