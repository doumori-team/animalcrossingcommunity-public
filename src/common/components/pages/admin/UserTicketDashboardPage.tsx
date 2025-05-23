import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Form, Text, Select } from '@form';
import { Pagination, Header, Search, Section, Grid } from '@layout';
import { constants, routerUtils } from '@utils';
import {
	APIThisType,
	UserTicketStatusType,
	UserTicketTypeType,
	UserTicketsType,
	CurrentRuleType,
	DenyReasonType,
} from '@types';

export const action = routerUtils.formAction;

const UserTicketDashboardPage = ({ loaderData }: { loaderData: UserTicketDashboardPageProps }) =>
{
	const { totalCount, userTickets, page, statuses, rules, types, statusId,
		assignee, ruleId, typeId, pageSize, denyReasons, violator,
		denyReasonId } = loaderData;

	const link = `&statusId=${encodeURIComponent(statusId)}
		&assignee=${encodeURIComponent(assignee)}
		&ruleId=${encodeURIComponent(ruleId)}
		&typeId=${encodeURIComponent(typeId)}
		&denyReasonId=${encodeURIComponent(denyReasonId)}
		&violator=${encodeURIComponent(violator)}
	`;

	return (
		<div className='UserTicketDashboardPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header name='User Ticket Dashboard' />

				<Search callback='/user-tickets'>
					<Form.Group>
						<Text
							label='Assignee'
							name='assignee'
							value={assignee}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Status'
							name='statusId'
							value={statusId}
							options={[{ id: 0, name: 'All Statuses' } as any,{ id: -1, name: 'All Open Statuses' } as any].concat(statuses)}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Rule'
							name='ruleId'
							value={ruleId}
							options={[{ id: 0, name: 'All Rules' } as any,{ id: -1, name: 'Any Rule' } as any].concat(rules.map(c => c.rules).flat().filter(r => r.reportable))}
							optionsMapping={{
								value: 'id',
								label: (rule: any) =>
								{
									if (!Object.prototype.hasOwnProperty.call(rule, 'number'))
									{
										return rule.name;
									}

									return `${rule.categoryId}.${rule.number} - ${rule.name ? rule.name : rule.description}`;
								},
							}}
							useReactSelect
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Type'
							name='typeId'
							value={typeId}
							options={[{ id: 0, description: 'All Types' } as any].concat(types)}
							optionsMapping={{ value: 'id', label: 'description' }}
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Deny Reason'
							name='denyReasonId'
							value={denyReasonId}
							options={[{ id: 0, name: 'All Deny Reasons' },{ id: -1, name: 'Any Deny Reason' }].concat(denyReasons)}
							optionsMapping={{ value: 'id', label: 'name' }}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='Violator'
							name='violator'
							value={violator}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='user ticket' options={userTickets}>
						{userTickets.map((userTicket, index) =>
							<div className='UserTicketDashboardPage_userTicket' key={index}>
								<div className='UserTicketDashboardPage_userTicketId'>
									ID: <Link to={`/user-ticket/${encodeURIComponent(userTicket.id)}`}>
										{userTicket.id}
									</Link>
								</div>

								<div className='UserTicketDashboardPage_userTicketViolator'>
									Violator: <Link to={`/profile/${encodeURIComponent(userTicket.violator.id)}`}>
										{userTicket.violator.username}
									</Link>
								</div>

								<div className='UserTicketDashboardPage_userTicketCreated'>
									Created: {userTicket.formattedCreated}
								</div>

								<div className='UserTicketDashboardPage_userTicketUpdated'>
									Last Updated: {userTicket.formattedLastUpdated}
								</div>

								<div className='UserTicketDashboardPage_userTicketAssignee'>
									Assignee: {userTicket.assignee ?
										<Link to={`/profile/${encodeURIComponent(userTicket.assignee.id)}`}>
											{userTicket.assignee.username}
										</Link> :
										'None'}
								</div>

								<div className='UserTicketDashboardPage_userTicketType'>
									Type: {userTicket.type.description}
								</div>

								<div className='UserTicketDashboardPage_userTicketStatus'>
									Status: {userTicket.status}
								</div>

								<div className='UserTicketDashboardPage_userTicketUsers'>
									# Users Reported: {userTicket.reportedUsers?.length}
								</div>

								{userTicket.formattedClosed &&
									<>
										{userTicket.rule &&
											<div className='UserTicketDashboardPage_userTicketRule'>
												Rule: {userTicket.rule}
											</div>
										}
										{userTicket.denyReason &&
											<div className='UserTicketDashboardPage_userTicketReason'>
												Deny Reason: {userTicket.denyReason}
											</div>
										}
										<div className='UserTicketDashboardPage_userTicketClosed'>
											Closed: {userTicket.formattedClosed}
										</div>
									</>
								}
							</div>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`user-tickets`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, query: { page?: string, statusId?: string, assignee?: string, ruleId?: string, typeId?: string, violator?: string, denyReasonId?: string }): Promise<UserTicketDashboardPageProps>
{
	const { page, statusId, assignee, ruleId, typeId, violator, denyReasonId } = query;

	const [statuses, rules, types, denyReasons, returnValue] = await Promise.all([
		this.query('v1/user_ticket/statuses'),
		this.query('v1/rule/current'),
		this.query('v1/user_ticket/types'),
		this.query('v1/user_ticket/deny_reasons'),
		this.query('v1/user_tickets', {
			page: page ? page : 1,
			statusId: 'statusId' in query ? statusId : -1,
			assignee: assignee ? assignee : '',
			ruleId: ruleId ? ruleId : '',
			typeId: typeId ? typeId : '',
			violator: violator ? violator : '',
			denyReasonId: denyReasonId ? denyReasonId : '',
		}),
	]);

	return {
		userTickets: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		statuses: statuses,
		rules: rules.currentRules,
		types: types,
		statusId: returnValue.statusId,
		assignee: returnValue.assignee,
		ruleId: returnValue.ruleId,
		typeId: returnValue.typeId,
		pageSize: returnValue.pageSize,
		denyReasons: denyReasons,
		violator: returnValue.violator,
		denyReasonId: returnValue.denyReasonId,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type UserTicketDashboardPageProps = {
	userTickets: UserTicketsType['results']
	totalCount: UserTicketsType['count']
	page: UserTicketsType['page']
	statuses: UserTicketStatusType[]
	rules: CurrentRuleType['currentRules']
	types: UserTicketTypeType[]
	statusId: UserTicketsType['statusId']
	assignee: UserTicketsType['assignee']
	ruleId: UserTicketsType['ruleId']
	typeId: UserTicketsType['typeId']
	pageSize: UserTicketsType['pageSize']
	denyReasons: DenyReasonType[]
	violator: UserTicketsType['violator']
	denyReasonId: UserTicketsType['denyReasonId']
};

export default UserTicketDashboardPage;
