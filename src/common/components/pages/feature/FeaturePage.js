import React, { useState } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { constants } from '@utils';
import { RequirePermission, RequireUser } from '@behavior';
import { Form, Button, RichTextArea, Switch } from '@form';
import { PermissionsContext } from '@contexts';
import { Header, Section, Tabs, Markup } from '@layout';

const FeaturePage = () =>
{
	const {feature, currentUserEmojiSettings, userEmojiSettings} = useLoaderData();
	const [staffOnly, setStaffOnly] = useState(true);

	const encodedId = encodeURIComponent(feature.id);

	const getMessagesSection = (type) =>
	{
		const messages = feature.messages.filter(m => type === 'staff' ? m.staffOnly : !m.staffOnly);

		return (
			<div className='FeaturePage_chat'>
				<h3>Messages: </h3>

				<div className='FeaturePage_messages'>
					{messages.length > 0 ? (
						messages.map(message =>
							<div key={message.id} className={`FeaturePage_message ${message.staffOnly && 'staff'}`}>
								<div className='FeaturePage_messageHeader'>
									<div className='FeaturePage_messageBy'>
										{message.user ? (
											<>
											Message By: <Link to={`/profile/${encodeURIComponent(message.user.id)}`}>
												{message.user.username}
											</Link>
											</>
										) : 'Staff Response'} on {message.formattedDate}
									</div>
								</div>

								<div className='UserTicketPage_message'>
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
		);
	}

	const postMessageSection = () =>
	{
		return (
			<Section>
				<Form
					action='v1/feature/message'
					callback={`/feature/${encodedId}`}
					showButton
				>
					<input type='hidden' name='id' value={feature.id} />

					<Form.Group>
						<RichTextArea
							textName='message'
							formatName='format'
							label='Message'
							emojiSettings={currentUserEmojiSettings}
							maxLength={constants.max.comment}
							required
							key={Math.random()}
						/>
					</Form.Group>
					<RequirePermission permission='advanced-features' silent>
						<Form.Group>
							<Switch
								name='staffOnly'
								label='Staff Only'
								value={staffOnly}
								key={staffOnly}
							/>
						</Form.Group>
					</RequirePermission>
				</Form>
			</Section>
		);
	}

	const changeTab = (eventKey) =>
	{
		setStaffOnly(eventKey === 'staff');
	}

	return (
		<div className='FeaturePage'>
			<RequireUser>
				<Header
					name={`Feature: ${feature.title}`}
					link='/features'
					links={
						<>
						<Link to={`/features/add`}>
							Suggest Feature / Report Bug
						</Link>
						<RequirePermission permission='claim-features' silent>
							<Link to={`/feature/${feature.id}/edit`}>
								Edit
							</Link>
						</RequirePermission>
						<Form action='v1/feature/follow'>
							<input type='hidden' name='id' value={feature.id} />
							<Button
								type='submit'
								label={feature.followed ? 'Following' : 'Follow'}
							/>
						</Form>
						</>
					}
				/>

				<Section>
					<div className='FeaturePage_description'>
						<Markup
							text={feature.description}
							format={feature.format ? feature.format : 'markdown'}
							emojiSettings={userEmojiSettings.filter(s => s.userId === feature.user.id)}
						/>
					</div>

					{feature.staffDescription && (
						<RequirePermission permission='advanced-features' silent>
							<Markup
								text={feature.staffDescription}
								format={feature.staffDescriptionFormat ? feature.staffDescriptionFormat : 'markdown'}
								emojiSettings={userEmojiSettings.filter(s => s.userId === feature.user.id)}
							/>
						</RequirePermission>
					)}

					<div className='FeaturePage_infoLine'>
						Created By: <Link to={`/profile/${feature.user.id}`}>
							{feature.user.username}
						</Link> ({feature.formattedCreated})
					</div>

					<RequirePermission permission='advanced-features' silent>
						{feature.assignedUsers.length > 0 && (
							<div className='FeaturePage_infoLine'>
								<b>Assigned User(s):</b>

								<ul className='FeaturePage_userList'>
									{feature.assignedUsers.map(user =>
										<li key={user.id}>{user.username}</li>
									)}
								</ul>
							</div>
						)}
					</RequirePermission>

					<div className='FeaturePage_infoLine'>
						Category: {feature.category}
					</div>

					<div className='FeaturePage_infoLine'>
						Status: {feature.status}
					</div>

					<div className='FeaturePage_infoLine'>
						Type: {feature.isBug ? 'Bug Report' : 'Feature Request'}
					</div>

					<PermissionsContext.Consumer>
						{permissions => {
							let actions = [];

							// Basic stuff
							if (permissions.indexOf('claim-features') !== -1)
							{
								switch (feature.statusId)
								{
									case constants.featureStatuses.suggestion:
										actions.push({
											form: 'update_status',
											text: 'To Discussion',
											newStatus: constants.featureStatuses.discussion,
										});

										break;
									case constants.featureStatuses.workList:
									case constants.featureStatuses.inProgress:
										!feature.claimed && actions.push({
											form: 'claim',
											text: 'Claim',
											newStatus: '',
										});

										break;
									default:
										break;
								}
							}

							// Team Leads
							if (permissions.indexOf('manage-features') !== -1)
							{
								switch (feature.statusId)
								{
									case constants.featureStatuses.discussion:
										actions.push({
											form: 'update_status',
											text: 'To Work List',
											newStatus: constants.featureStatuses.workList,
										});
									case constants.featureStatuses.suggestion:
										actions.push({
											form: 'update_status',
											text: 'Reject',
											newStatus: constants.featureStatuses.rejected,
										});

										break;
									case constants.featureStatuses.inProgress:
										actions.push({
											form: 'update_status',
											text: 'To Live',
											newStatus: constants.featureStatuses.live,
										});

										break;
									default:
										break;
								}
							}

							return (
								<ul className='FeaturePage_actionList'>
									{actions.map(action =>
										<li key={action.newStatus}>
											<Form
												action={`v1/feature/${action.form}`}
												callback={`/feature/${feature.id}`}
												showButton
												buttonText={action.text}
											>
												<input
													type='hidden'
													name='id'
													value={feature.id}
												/>
												{action.form !== 'claim' && (
													<input
														type='hidden'
														name='newStatus'
														value={action.newStatus}
													/>
												)}
											</Form>
										</li>
									)}
								</ul>
							);
						}}
					</PermissionsContext.Consumer>
				</Section>

				<PermissionsContext.Consumer>
					{permissions => permissions && (
						permissions.indexOf('advanced-features') !== -1 ? (
							<>
							<Tabs defaultActiveKey={feature.staffOnly ? 'staff' : 'community'} variant='light' onSelect={changeTab}>
								<Tabs.Tab eventKey='staff' title='Staff Messages'>
									{getMessagesSection('staff')}
								</Tabs.Tab>
								<Tabs.Tab eventKey='community' title='Community Messages'>
									{getMessagesSection('community')}
								</Tabs.Tab>
							</Tabs>
							{postMessageSection()}
							</>
						) : (
							<>
							{getMessagesSection('community')}
							{!feature.readOnly && (
								postMessageSection()
							)}
							</>
						)
					)}
				</PermissionsContext.Consumer>
			</RequireUser>
		</div>
	);
}

export async function loadData({id})
{
	const [feature, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/feature', {id: id}),
		this.query('v1/settings/emoji'),
	]);

	const [userEmojiSettings] = await Promise.all([
		feature.messages.length > 0 ? this.query('v1/settings/emoji', {userIds: feature.messages.map(m => m.user?.id)}) : [],
	]);

	return {feature, currentUserEmojiSettings, userEmojiSettings};
}

export default FeaturePage;