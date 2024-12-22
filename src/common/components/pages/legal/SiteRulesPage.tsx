import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { ContentBox, HTMLPurify } from '@layout';
import { dateUtils } from '@utils';
import { APIThisType, CurrentRuleType } from '@types';

const SiteRulesPage = () =>
{
	const { rules, lastUpdated } = useLoaderData() as SiteRulesPageProps;

	return (
		<div className='SiteRulesPage'>
			<ContentBox>
				<h1>Community Guidelines</h1>
				<p>Animal Crossing Community (ACC) is a family-friendly website which the Staff endeavor to make a pleasant environment for everyone. To ensure that we keep the friendliness of the site intact, the Moderators and Administrators (Modmins) have a zero tolerance policy towards bullying, harassment, trolling, griefing, flaming, offensive content, and vulgar language. This is reflected in the Community Guidelines, and we urge all members to become familiar with them.</p>
				<p>Listed below are the Community Guidelines in brief. Persistent violations or severe infractions, may result in a long-term ban from ACC. Some of the guidelines provide examples of what is considered to be a breach of the guideline. Although different people will have different ideas of what is covered by those guidelines, the Modmins will determine whether a guideline has been broken.</p>
				<p>A violation of any Community Guideline will result in either a message or a notification from the Modmins to the Member. Each type of communication will outline which guideline has been breached. Such communications will remain as Notifications in the Tickets section for members to view. All members have the opportunity to respond to any Notification they may not understand.</p>
				<p><strong>NOTE:</strong> Whenever these guidelines are updated, you will be notified and asked to accept the updated guidelines before continuing to the site. Dates next to headings indicate date added or last updated. Updated guidelines are noted with <span className='SiteRulesPage_ruleUpdated'>Blue dates</span>, and added guidelines are noted with <span className='SiteRulesPage_ruleNew'>Red dates</span>.</p>
				<p><strong>Last Updated</strong>: {dateUtils.formatDateTimezone(lastUpdated)}</p>
			</ContentBox>
			<div className='SiteRulesPage_rules'>
				{rules.map((category, index) =>
					<ContentBox key={category.id}>
						<div className='SiteRulesPage_category'>
							{index + 1}. {category.name}
						</div>
						{category.rules.map(rule =>
							<div key={rule.id} className='SiteRulesPage_rule'>
								{rule.name ?
									<>
										<div className='SiteRulesPage_ruleTitle'>
											<strong>{rule.number}{rule.name}</strong>{' - '}
										</div>
										<HTMLPurify
											className='SiteRulesPage_ruleDescription'
											html={`${rule.description}` + `<span class=${dateUtils.isSame(lastUpdated, rule.startDate) ? rule.originalRuleId ? 'SiteRulesPage_ruleDate SiteRulesPage_ruleUpdated' : 'SiteRulesPage_ruleDate SiteRulesPage_ruleNew' : 'SiteRulesPage_ruleDate'}> (${dateUtils.formatDateTime5(rule.startDate)})</span>`}
										/>
									</>
									:
									<>
										<HTMLPurify
											className='SiteRulesPage_ruleDescription'
											html={`<span class='SiteRulesPage_ruleTitle'><strong>${rule.number}</strong> - </span>` + `${rule.description}` + `<span class=${dateUtils.isSame(lastUpdated, rule.startDate) ? rule.originalRuleId ? 'SiteRulesPage_ruleDate SiteRulesPage_ruleUpdated' : 'SiteRulesPage_ruleDate SiteRulesPage_ruleNew' : 'SiteRulesPage_ruleDate'}> (${dateUtils.formatDateTime5(rule.startDate)})</span>`}
										/>
									</>
								}

								{rule.violations.length > 0 &&
									<div className='SiteRulesPage_ruleViolations'>
										{rule.violations.map(violation =>
											<div key={violation.id} className={`SiteRulesPage_violation severity_${violation.severityId}`}>
												<strong>{violation.severityId ? violation.severityId : String.fromCharCode(96 + violation.number)}</strong> {violation.violation}
											</div>,
										)}
									</div>
								}
							</div>,
						)}
					</ContentBox>,
				)}
			</div>
		</div>
	);
};

export async function loadData(this: APIThisType): Promise<SiteRulesPageProps>
{
	const [rules] = await Promise.all([
		this.query('v1/rule/current'),
	]);

	return {
		rules: rules.currentRules,
		lastUpdated: rules.lastUpdated,
	};
}

type SiteRulesPageProps = {
	rules: CurrentRuleType['currentRules']
	lastUpdated: CurrentRuleType['lastUpdated']
};

export default SiteRulesPage;
