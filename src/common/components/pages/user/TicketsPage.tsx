import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header, Section, Grid } from '@layout';
import { APIThisType, TicketType, SupportTicketType } from '@types';

const TicketsPage = () =>
{
	const { tickets, supportTickets } = useLoaderData() as TicketsPageProps;

	return (
		<div className='TicketsPage'>
			<Header
				name='Tickets'
				description='Tickets are messages to users directly from the staff. These are used to describe and keep track of any changes that had to be made to your account or content (such as threads, patterns, etc.) and any other communications you had with the staff. If you have any questions about a ticket you received you can ask the staff directly on the ticket itself. If you have any questions about ACC or your account you can press the "Create Support Ticket" button to submit that question directly to staff.'
				links={
					<RequirePermission permission='submit-support-tickets' silent>
						<Link to='/support-tickets/add'>
							Create Support Ticket
						</Link>
					</RequirePermission>
				}
			/>

			<Section>
				<Grid name='user ticket' options={tickets}>
					{tickets.map((ticket, index) =>
						<div className='TicketsPage_ticket' key={index}>
							<div className='TicketsPage_ticketId'>
								ID: <Link to={`/ticket/${encodeURIComponent(ticket.id)}`}>
									{ticket.id}
								</Link>
							</div>

							<div className='TicketsPage_ticketType'>
								Type: {ticket.type.description}
							</div>

							<div className='TicketsPage_ticketRule'>
								Rule: {ticket.rule}
							</div>

							<div className='TicketsPage_ticketDate'>
								Date: {ticket.formattedClosed}
							</div>
						</div>,
					)}
				</Grid>
			</Section>

			<Section>
				<Grid name='support ticket' options={supportTickets}>
					{supportTickets.map((ticket, index) =>
						<div className='TicketsPage_supportTicket' key={index}>
							<div className='TicketsPage_ticketId'>
								<Link to={`/support-ticket/${encodeURIComponent(ticket.id)}`}>
									{ticket.title}
								</Link>
							</div>

							<div className='TicketsPage_ticketDate'>
								Date: {ticket.formattedCreated}
							</div>
						</div>,
					)}
				</Grid>
			</Section>
		</div>
	);
};

export async function loadData(this: APIThisType)
{
	const [tickets, supportTickets] = await Promise.all([
		this.query('v1/users/tickets'),
		this.query('v1/users/support_tickets'),
	]);

	return { tickets, supportTickets };
}

type TicketsPageProps = {
	tickets: TicketType[]
	supportTickets: SupportTicketType[]
};

export default TicketsPage;
