import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text, Select } from '@form';
import { Pagination, Header, Search, Section, Grid } from '@layout';
import { constants } from '@utils';
import { APIThisType, SupportTicketsType } from '@types';

const SupportTicketDashboardPage = () =>
{
	const { username, userTicketId, supportTickets, page, pageSize, totalCount,
		status } = useLoaderData() as SupportTicketDashboardPageProps;

	const link = `&username=${encodeURIComponent(username)}
		&userTicketId=${encodeURIComponent(String(userTicketId || ''))}
		&status=${encodeURIComponent(status)}
	`;

	return (
		<div className='SupportTicketDashboardPage'>
			<RequirePermission permission='process-support-tickets'>
				<Header
					name='Support Ticket Dashboard'
					description='You can find user support tickets here. You must search by username, user ticket or status first for results to show.'
					links={
						<Link to='/support-tickets/add'>
							Create Support Ticket
						</Link>
					}
				/>

				<Search callback='/support-tickets'>
					<Form.Group>
						<Text
							label='Username'
							name='username'
							value={username}
							maxLength={constants.max.searchUsername}
						/>
					</Form.Group>
					<Form.Group>
						<Text
							label='User Ticket ID'
							name='userTicketId'
							value={userTicketId}
							type='number'
						/>
					</Form.Group>
					<Form.Group>
						<Select
							label='Status'
							name='status'
							value={status}
							options={[{ value: '', label: 'All Statuses' }].concat(constants.supportTicket.statuses.map(s =>
							{
								return {
									value: s,
									label: s,
								};
							}))}
						/>
					</Form.Group>
				</Search>

				<Section>
					<Grid name='support ticket' options={supportTickets}>
						{supportTickets.map((supportTicket, index) =>
							<div className={`SupportTicketDashboardPage_supportTicket ${supportTicket.staffOnly && 'staff'}`} key={index}>
								<div className='SupportTicketDashboardPage_supportTicketId'>
									<Link to={`/support-ticket/${encodeURIComponent(supportTicket.id)}`}>
										{supportTicket.title}
									</Link>
								</div>

								<div className='SupportTicketDashboardPage_supportTicketUser'>
									User: <Link to={`/profile/${encodeURIComponent(supportTicket.user.id)}`}>
										{supportTicket.user.username}
									</Link>
								</div>

								<div className='SupportTicketDashboardPage_supportTicketCreated'>
									Created: {supportTicket.formattedCreated}
								</div>

								<div className='SupportTicketDashboardPage_supportTicketStatus'>
									Status: {supportTicket.status}
								</div>

								{supportTicket.userTicketId &&
									<div className='SupportTicketDashboardPage_supportTicketUT'>
										UT: <Link to={`/user-ticket/${encodeURIComponent(supportTicket.userTicketId)}`}>
											{supportTicket.userTicketId}
										</Link>
									</div>
								}

								{supportTicket.ban &&
									<div className='SupportTicketDashboardPage_supportTicketBan'>
										Ban Length (w/ST): {supportTicket.ban.description}
									</div>
								}

								<div className='SupportTicketDashboardPage_supportTicketStaffOnly'>
									Staff Only: {supportTicket.staffOnly ? 'Yes' : 'No'}
								</div>
							</div>,
						)}
					</Grid>

					<Pagination
						page={page}
						pageSize={pageSize}
						totalCount={totalCount}
						startLink={`support-tickets`}
						endLink={link}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, _: any, { page, username, userTicketId, status }: { page?: string, username?: string, userTicketId?: string, status?: string }): Promise<SupportTicketDashboardPageProps>
{
	const [returnValue] = await Promise.all([
		this.query('v1/support_tickets', {
			page: page ? page : 1,
			username: username ? username : '',
			userTicketId: userTicketId ? userTicketId : '',
			status: status ? status : '',
		}),
	]);

	return {
		supportTickets: returnValue.results,
		totalCount: returnValue.count,
		page: returnValue.page,
		pageSize: returnValue.pageSize,
		username: returnValue.username,
		userTicketId: returnValue.userTicketId,
		status: returnValue.status,
	};
}

type SupportTicketDashboardPageProps = {
	supportTickets: SupportTicketsType['results']
	totalCount: SupportTicketsType['count']
	page: SupportTicketsType['page']
	pageSize: SupportTicketsType['pageSize']
	username: SupportTicketsType['username']
	userTicketId: SupportTicketsType['userTicketId']
	status: SupportTicketsType['status']
};

export default SupportTicketDashboardPage;
