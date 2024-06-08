import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Confirm, TextArea } from '@form';
import { Header, Section, Markup } from '@layout';
import { constants } from '@utils';

const SupportEmailPage = () =>
{
	const {supportEmail} = useLoaderData();

	const encodedId = encodeURIComponent(supportEmail.id);

	return (
		<div className='SupportEmailPage'>
			<RequirePermission permission='process-user-tickets'>
				<Header
					name={`Support Email #${supportEmail.id}`}
					links={
						<>
						<Link to={`/support-emails`}>
							Dashboard
						</Link>
						{!supportEmail.read && (
							<Confirm
								action='v1/support_email/read'
								callback={`/support-email/${encodedId}`}
								id={supportEmail.id}
								label='Read'
								message='Are you sure you want to mark this email as read?'
							/>
						)}
						</>
					}
				/>

				<Section>
					{supportEmail.fromUser && (
						<div className='SupportEmailPage_fromUser'>
							From: {supportEmail.fromUser.id && (
								<Link to={`/profile/${encodeURIComponent(supportEmail.fromUser.id)}`}>
									{supportEmail.fromUser.username}
								</Link>
							)} {supportEmail.fromUser.email && `<${supportEmail.fromUser.email}>`}
						</div>
					)}

					{supportEmail.toUser && (
						<div className='SupportEmailPage_toUser'>
							To: {supportEmail.toUser.id && (
								<Link to={`/profile/${encodeURIComponent(supportEmail.toUser.id)}`}>
									{supportEmail.toUser.username}
								</Link>
							)} {supportEmail.toUser.email && `<${supportEmail.toUser.email}>`}
						</div>
					)}

					<div className='SupportEmailPage_subject'>
						Subject: {supportEmail.subject}
					</div>

					<div className='SupportEmailPage_date'>
						Date: {supportEmail.formattedRecorded}
					</div>

					<div className='SupportEmailPage_read'>
						Read: {supportEmail.read ? 'Yes' : 'No'}
					</div>

					<div className='SupportEmailPage_body'>
						<Markup
							text={supportEmail.body}
							format='markdown+html'
						/>
					</div>
				</Section>

				{supportEmail.fromUser.email && (
					<Section>
						<Form
							action='v1/support_email/reply'
							callback='/support-emails'
							showButton
						>
							<input type='hidden' name='id' value={supportEmail.id} />

							<Form.Group>
								<TextArea
									name='message'
									label='Reply'
									rows={10}
									maxLength={constants.max.email}
								/>
							</Form.Group>
						</Form>
					</Section>
				)}
			</RequirePermission>
		</div>
	);
}

export async function loadData({id})
{
	const [supportEmail] = await Promise.all([
		this.query('v1/support_email', {id: id}),
	]);

	return {
		supportEmail
	};
}

export default SupportEmailPage;
