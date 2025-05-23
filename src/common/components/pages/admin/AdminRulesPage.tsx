import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { dateUtils, routerUtils } from '@utils';
import { Confirm } from '@form';
import { Header, HTMLPurify } from '@layout';
import { APIThisType, PendingRuleType } from '@types';

export const action = routerUtils.formAction;

const AdminRulesPage = ({ loaderData }: { loaderData: AdminRulesPageProps }) =>
{
	const { rules } = loaderData;

	return (
		<RequirePermission permission='view-rules-admin'>
			<div className='AdminRulesPage'>
				<Header
					name='General Rules'
					links={
						<RequirePermission permission='modify-rules-admin' silent>
							<Link to={`/admin/rules/add`}>
								Add Rule
							</Link>

							<Confirm
								action='v1/admin/rule/publish'
								callback='/rules'
								label='Publish'
								message='Are you sure you want to publish rules to live?'
							/>
						</RequirePermission>
					}
				/>

				{rules.map(rule =>
					<div key={rule.id} className='AdminRulesPage_rule'>
						<RequirePermission permission='modify-rules-admin' silent>
							<div className='AdminRulesPage_links'>
								<Link to={`/admin/rules/${encodeURIComponent(rule.pendingRule ? rule.pendingRule.id : rule.id)}`}>
									Edit
								</Link>
								<Link to={`/admin/rules/${encodeURIComponent(rule.id)}/add`}>
									Add Violation
								</Link>
								{rule.pendingExpiration ?
									<Confirm
										action='v1/admin/rule/restore'
										callback='/rules'
										id={rule.id}
										label='Restore'
										message='Are you sure you want to restore this rule?'
										formId={`rule-restore-${rule.id}`}
									/>
									:
									<>
										{rule.pendingRule &&
											<Confirm
												action='v1/admin/rule/destroy'
												callback='/rules'
												id={rule.pendingRule.id}
												label='Revert'
												message='Are you sure you want to revert this rule?'
												formId={`rule-revert-${rule.id}`}
											/>
										}

										{!rule.startDate ?
											<Confirm
												action='v1/admin/rule/destroy'
												callback='/rules'
												id={rule.id}
												label='Delete'
												message='Are you sure you want to delete this rule?'
												formId={`rule-destroy-${rule.id}`}
											/>
											:
											<Confirm
												action='v1/admin/rule/expire'
												callback='/rules'
												id={rule.id}
												label='Expire'
												message='Are you sure you want to expire this rule?'
												formId={`rule-expire-${rule.id}`}
											/>
										}
									</>
								}
							</div>
						</RequirePermission>

						<div className='AdminRulesPage_ruleInfo'>
							{rule.startDate ?
								<div className='AdminRulesPage_currentRule'>
									<div className='AdminRulesPage_ruleCategory'>
										{rule.category}
									</div>

									<div className='AdminRulesPage_ruleTitle'>
										<strong>{rule.number}{rule.name ? ` ${rule.name}` : ''}</strong> - <span>{dateUtils.formatDateTime(rule.startDate)}</span>{rule.reportable ? '' : ' (Reportable: No)'}
									</div>

									<HTMLPurify
										className='AdminRulesPage_ruleDescription'
										html={rule.description}
									/>
								</div>
								:
								<div className='AdminRulesPage_pendingRule AdminRulesPage_newRule'>
									<div className='AdminRulesPage_ruleCategory'>
										{rule.category}
									</div>

									<div className='AdminRulesPage_ruleTitle'>
										<strong>{rule.number}{rule.name ? ` ${rule.name}` : ''}</strong> - <span>NEW</span>{rule.reportable ? '' : ' (Reportable: No)'}
									</div>

									<HTMLPurify
										className='AdminRulesPage_ruleDescription'
										html={rule.description}
									/>
								</div>
							}

							{rule.pendingRule &&
								<div className='AdminRulesPage_pendingRule'>
									<div className={`AdminRulesPage_ruleTitle ${(rule.pendingRule.number !== rule.number || rule.pendingRule.name !== rule.name) && 'AdminRulesPage_modifiedRule'}`}>
										<strong>{rule.pendingRule.number}{rule.pendingRule.name ? ` ${rule.pendingRule.name}` : ''}</strong>
									</div>

									<HTMLPurify
										className={`AdminRulesPage_ruleDescription ${rule.pendingRule.description !== rule.description && 'AdminRulesPage_modifiedRule'}`}
										html={rule.pendingRule.description}
									/>
								</div>
							}

							{rule.pendingExpiration &&
								<div className='AdminRulesPage_pendingRule AdminRulesPage_expiredRule'>
									<div className='AdminRulesPage_ruleTitle'>
										<strong>{rule.number}{rule.name ? ` ${rule.name}` : ''}</strong> - <span>{dateUtils.formatDateTime(rule.startDate)}</span>
									</div>

									<HTMLPurify
										className='AdminRulesPage_ruleDescription'
										html={rule.description}
									/>
								</div>
							}

							{rule.startDate && !rule.pendingRule && !rule.pendingExpiration &&
								<div />
							}

							{rule.startDate && rule.violations.length > 0 &&
								<div className='AdminRulesPage_ruleViolations'>
									<u>Violations</u>
									{rule.violations.map(violation =>
										<div key={violation.id} className='AdminRulesPage_violation'>
											<RequirePermission permission='modify-rules-admin' silent>
												<div className='AdminRulesPage_links'>
													{rule.pendingViolations.length === 0 &&
														<Link to={`/admin/rules/${encodeURIComponent(rule.id)}/${encodeURIComponent(violation.id)}`}>
															Edit
														</Link>
													}
													{violation.pendingExpiration ?
														<Confirm
															action='v1/admin/rule/violation/restore'
															callback='/rules'
															id={violation.id}
															label='Restore'
															message='Are you sure you want to restore this violation?'
															formId={`violation-restore-${violation.id}`}
														/>
														:
														<Confirm
															action='v1/admin/rule/violation/expire'
															callback='/rules'
															id={violation.id}
															label='Expire'
															message='Are you sure you want to expire this violation?'
															formId={`violation-expire-${violation.id}`}
														/>
													}
												</div>
											</RequirePermission>

											<strong>{violation.severityId}</strong> {violation.violation}
										</div>,
									)}
								</div>
							}

							{rule.pendingViolations.length > 0 &&
								<div className='AdminRulesPage_pendingRuleViolations'>
									<u>Violations</u>
									{rule.pendingViolations.map(violation =>
										<div key={violation.id} className={`AdminRulesPage_pendingViolation ${!violation.startDate && 'AdminRulesPage_newViolation'} ${violation.pendingExpiration && 'AdminRulesPage_expiredViolation'}`}>
											<RequirePermission permission='modify-rules-admin' silent>
												<div className='AdminRulesPage_links'>
													<Link to={`/admin/rules/${encodeURIComponent(rule.id)}/${encodeURIComponent(violation.pendingViolation ? violation.pendingViolation.id : violation.id)}`}>
														Edit
													</Link>
													{violation.pendingExpiration ?
														<Confirm
															action='v1/admin/rule/violation/restore'
															callback='/rules'
															id={violation.id}
															label='Restore'
															message='Are you sure you want to restore this violation?'
															formId={`violation-restore-${violation.id}`}
														/>
														:
														<>
															{violation.pendingViolation &&
																<Confirm
																	action='v1/admin/rule/violation/destroy'
																	callback='/rules'
																	id={violation.pendingViolation.id}
																	label='Revert'
																	message='Are you sure you want to revert this violation?'
																	formId={`violation-destroy-${violation.pendingViolation.id}`}
																/>
															}

															{!violation.startDate ?
																<Confirm
																	action='v1/admin/rule/violation/destroy'
																	callback='/rules'
																	id={violation.id}
																	label='Delete'
																	message='Are you sure you want to delete this violation?'
																	formId={`violation-destroy-${violation.id}`}
																/>
																:
																<Confirm
																	action='v1/admin/rule/violation/expire'
																	callback='/rules'
																	id={violation.id}
																	label='Expire'
																	message='Are you sure you want to expire this violation?'
																	formId={`violation-expire-${violation.id}`}
																/>
															}
														</>
													}
												</div>
											</RequirePermission>

											{violation.pendingViolation && !violation.pendingExpiration ?
												<span className={`AdminRulesPage_modifiedViolation`}><strong>{violation.pendingViolation.severityId}</strong> {violation.pendingViolation.violation}</span>
												:
												<span><strong>{violation.severityId}</strong> {violation.violation}</span>
											}
										</div>,
									)}
								</div>
							}
						</div>
					</div>,
				)}
			</div>
		</RequirePermission>
	);
};

async function loadData(this: APIThisType): Promise<AdminRulesPageProps>
{
	const [rules] = await Promise.all([
		this.query('v1/rule/pending'),
	]);

	return { rules };
}

export const loader = routerUtils.wrapLoader(loadData);

type AdminRulesPageProps = {
	rules: PendingRuleType[]
};

export default AdminRulesPage;
