import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Text, Select, RichTextArea, Switch, Checkbox } from '@form';
import { Header, Section, Markup } from '@layout';
import { constants, dateUtils } from '@utils';

const SupportTicketPage = () =>
{
	const {supportTicket, userEmojiSettings, currentUserEmojiSettings, usernameHistory} = useLoaderData();

	return (
		<div className='SupportTicketPage'>
			<Header
				name={supportTicket.title}
				links={
					<RequirePermission permission='process-support-tickets' silent>
						<Link to={`/support-tickets?username=${encodeURIComponent(supportTicket.user.username)}`}>
							ST Dashboard
						</Link>
					</RequirePermission>
				}
			/>

			<div className='SupportTicketPage_info'>
				<div className='SupportTicketPage_user'>
					User: <Link to={`/profile/${encodeURIComponent(supportTicket.user.id)}`}>
						{supportTicket.user.username}
					</Link>
				</div>

				<div className='SupportTicketPage_supportTicketCreated'>
					Created: {supportTicket.formattedCreated}
				</div>

				{supportTicket.userTicketId && (
					<div className='SupportTicketPage_supportTicketUT'>
						UT: <Link to={`/user-ticket/${encodeURIComponent(supportTicket.userTicketId)}`}>
							{supportTicket.userTicketId}
						</Link>
					</div>
				)}

				{supportTicket.ban && (
					<div className='SupportTicketPage_supportTicketBan'>
						Ban Length (w/ST): {supportTicket.ban.description}
					</div>
				)}

				<RequirePermission permission='process-support-tickets' silent>
					<div className='SupportTicketPage_supportTicketStaffOnly'>
						Staff Only: {supportTicket.staffOnly ? 'Yes' : 'No'}
					</div>
					<div className='SupportTicketPage_supportTicketStatus'>
						Status: {supportTicket.status}
					</div>
				</RequirePermission>
			</div>

			<div className='SupportTicketPage_chat'>
				<h3>Messages: </h3>

				<div className='SupportTicketPage_messages'>
					{supportTicket.messages.length > 0 ? (
						supportTicket.messages.map(message =>
							<div key={message.id} className={`SupportTicketPage_message ${message.staffOnly && 'staff'}`}>
								<div className='SupportTicketPage_messageHeader'>
									<div className='SupportTicketPage_messageBy'>
										{message.user ? (
											<>
											Message By: <Link to={`/profile/${encodeURIComponent(message.user.id)}`}>
												{message.user.username}
											</Link>
											</>
										) : 'Staff Response'} on {message.formattedDate}<RequirePermission permission='process-support-tickets' silent> (Staff Only: {message.staffOnly ? 'Yes' : 'No'})</RequirePermission>
									</div>
								</div>

								<div className='SupportTicketPage_message'>
									{message.user ? <Markup
										text={message.message}
										format={message.format ?
											message.format :
											'markdown'}
										emojiSettings={userEmojiSettings.filter(s => s.userId === message.user.id)}
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
			</div>

			<Section>
				<Form
					action='v1/support_ticket/message'
					callback={`/support-ticket/${encodeURIComponent(supportTicket.id)}`}
					showButton
				>
					<input type='hidden' name='id' value={supportTicket.id} />

					<RequirePermission permission='process-support-tickets' silent>
						<Form.Group>
							<Text
								label='User Ticket ID'
								name='userTicketId'
								value={supportTicket.userTicketId ? supportTicket.userTicketId : 0}
								type='number'
							/>
						</Form.Group>
						<Form.Group>
							<Select
								label='Status'
								name='status'
								value={supportTicket.status}
								options={constants.supportTicket.statuses.map(s => {
									return {
										value: s,
										label: s,
									}
								})}
							/>
						</Form.Group>
						<Form.Group>
							<Switch
								name='staffOnly'
								label='Staff Only'
								value={true}
							/>
						</Form.Group>
						{usernameHistory.length > 0 && (
							<Form.Group>
								<label>Delete Specific Username History:</label>
								{usernameHistory.map(history =>
									<div key={history.id}>
										<Checkbox
											type='radio'
											name='usernameHistoryId'
											value={history.id}
											label={`${history.username} (${dateUtils.formatDateTime(history.changed)})`}
										/>
									</div>
								)}
							</Form.Group>
						)}
					</RequirePermission>

					<Form.Group>
						<RichTextArea
							textName='message'
							formatName='format'
							label='Message'
							emojiSettings={currentUserEmojiSettings}
							maxLength={constants.max.post1}
							required
							key={Math.random()}
						/>
					</Form.Group>
				</Form>
			</Section>
		</div>
	);
}

export async function loadData({id})
{
	const [supportTicket, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/support_ticket', {id: id}),
		this.query('v1/settings/emoji'),
	]);

	const [userEmojiSettings, usernameHistory] = await Promise.all([
		supportTicket.messages.length > 0 ?
			this.query('v1/settings/emoji', {
				userIds: supportTicket.messages.filter(m => m.user).map(m => m.user.id)
			}) : null,
		this.query('v1/users/username_history', {id: supportTicket.user.id}),
	]);

	return {supportTicket, userEmojiSettings, currentUserEmojiSettings, usernameHistory};
}

export default SupportTicketPage;
