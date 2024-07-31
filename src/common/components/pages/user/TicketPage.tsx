import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { Form, RichTextArea } from '@form';
import { utils, constants } from '@utils';
import { Header, Markup } from '@layout';
import { APIThisType, EmojiSettingType, TicketType } from '@types';

const TicketPage = () =>
{
	const {ticket, ticketUserEmojiSettings} = useLoaderData() as TicketPageProps;

	const referenceLink = utils.getReferenceLink(ticket);
	const encodedId = encodeURIComponent(ticket.id);

	return (
		<div className='TicketPage'>
			<Header name={`Ticket #${ticket.id}`} />

			<div className='TicketPage_info'>
				<div className='Tick'>
					Type: {ticket.type.description}
				</div>

				<div className='TicketPage_referenceId'>
					Reference ID: <Link to={referenceLink}>
						{referenceLink}
					</Link>
				</div>

				<div className='TicketPage_content'>
					Reference Content:
					{ticket.reference.text && (
						<Markup
							text={ticket.reference.text}
							format={ticket.reference.format ?
								ticket.reference.format :
								'markdown'}
							emojiSettings={ticketUserEmojiSettings}
						/>
					)}
					{ticket.reference.url && (
						<div className='TicketPage_referenceUrl'>
							<img src={ticket.reference.url} alt='Reference Image' />
						</div>
					)}
				</div>

				<div className='TicketPage_date'>
					Date: {ticket.formattedClosed}
				</div>

				<div className='TicketPage_rule'>
					Rule: {ticket.rule}
				</div>

				{ticket.violation && (
					<div className='TicketPage_violation'>
						Violation: {ticket.violation}
					</div>
				)}

				<div className='TicketPage_action'>
					Action: {ticket.action.name}
				</div>

				{(ticket.action.identifier === constants.userTicket.actions.modify && ticket.updatedContent != null) && (
					<div className='TicketPage_updatedContent'>
						Updated Content: <Markup
							text={ticket.updatedContent}
							format={ticket.reference.format ?
								ticket.reference.format :
								'markdown'}
							emojiSettings={ticketUserEmojiSettings}
						/>
					</div>
				)}

				<div className='TicketPage_ban'>
					Ban Length (for Ticket): {ticket.banLength}
				</div>
			</div>

			<div className='TicketPage_chat'>
				<h3>Messages: </h3>

				<div className='TicketPage_messages'>
					{ticket.messages.length > 0 ? (
						ticket.messages.map((message:TicketType['messages'][number]) =>
							<div key={message.id} className='TicketPage_message'>
								<div className='TicketPage_messageBy'>
									{message.user ? (
										<>
										Message By: <Link to={`/profile/${encodeURIComponent(message.user.id)}`}>
											{message.user.username}
										</Link>
										</>
									) : 'Staff Response'} on {message.formattedDate}
								</div>

								<div className='TicketPage_message'>
									{message.user ? <Markup
										text={message.message}
										format={message.format ?
											message.format :
											'markdown'}
										emojiSettings={ticketUserEmojiSettings}
									/> : <Markup
										text={message.message}
										format={message.format ?
											message.format :
											'markdown'}
									/>}
								</div>
							</div>
						)
					) : (
						'No messages have been posted.'
					)}
				</div>

				<div className='TicketPage_makeMessage'>
					<Form
						action='v1/user_ticket/message'
						callback={`/ticket/${encodedId}`}
						showButton
					>
						<input type='hidden' name='id' value={ticket.id} />

						<Form.Group>
							<RichTextArea
								textName='message'
								formatName='format'
								label='Message'
								emojiSettings={ticketUserEmojiSettings}
								maxLength={constants.max.comment}
								required
							/>
						</Form.Group>
					</Form>
				</div>
			</div>
		</div>
	);
}

export async function loadData(this: APIThisType, {id}: {id?: string}) : Promise<TicketPageProps>
{
	const [ticket] = await Promise.all([
		this.query('v1/users/ticket', {id: id}),
	]);

	const [ticketUserEmojiSettings] = await Promise.all([
		this.query('v1/settings/emoji', {userIds: [ticket.violator.id]}),
	]);

	return {ticket, ticketUserEmojiSettings};
}

type TicketPageProps = {
	ticket: TicketType
	ticketUserEmojiSettings: EmojiSettingType[]
}

export default TicketPage;
