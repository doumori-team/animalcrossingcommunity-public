import * as db from '@db';

export default async function current()
{
	const [rules, violations, [rulesSetting], categories] = await Promise.all([
		db.query(`
			SELECT
				rule.id,
				rule.number,
				rule.name,
				rule.start_date,
				rule.description,
				rule.original_rule_id,
				rule.category_id,
				rule_category.name AS category,
				rule.reportable
			FROM rule
			JOIN rule_category ON (rule.category_id = rule_category.id)
			WHERE rule.start_date IS NOT NULL AND rule.expiration_date IS NULL
			ORDER BY rule.number ASC
		`),
		db.query(`
			SELECT
				rule_violation.id,
				rule_violation.severity_id,
				rule_violation.violation,
				rule_violation.rule_id,
				rule_violation.number
			FROM rule_violation
			JOIN rule ON (rule.id = rule_violation.rule_id)
			WHERE rule.start_date IS NOT NULL AND rule.expiration_date IS NULL AND rule_violation.start_date IS NOT NULL AND rule_violation.expiration_date IS NULL
			ORDER BY rule_violation.severity_id ASC, rule_violation.number ASC
		`),
		db.query(`
			SELECT
				updated
			FROM site_setting
			WHERE name = 'Rules'
		`),
		this.query('v1/rule/categories'),
	]);

	let currentRules = categories.map(category => {
		return {
			id: category.id,
			name: category.name,
			rules: rules
				.filter(rule => rule.category_id === category.id)
				.map(rule => {
					return {
						id: rule.id,
						number: rule.number,
						name: rule.name,
						startDate: rule.start_date,
						description: rule.description,
						violations: violations.filter(v => v.rule_id === rule.id).map(violation => {
							return {
								id: violation.id,
								severityId: violation.severity_id,
								violation: violation.violation,
								number: violation.number,
							};
						}),
						originalRuleId: rule.original_rule_id,
						categoryId: rule.category_id,
						category: rule.category,
						reportable: rule.reportable,
					};
				})
		}
	});

	return {
		currentRules: currentRules.filter(c => c.rules.length > 0),
		lastUpdated: rulesSetting.updated,
	}
}