import React, { useState, useRef } from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission, RequireClientJS } from '@behavior';
import { Form, Confirm, TextArea, Switch, Select, Checkbox, Button, RichTextArea, Alert } from '@form';
import { utils, constants } from '@utils';
import { UserContext, PermissionsContext } from '@contexts';
import { Header, ErrorMessage, Tabs, Section, Markup, HTMLPurify } from '@layout';
import {
	APIThisType,
	UserTicketType,
	DenyReasonType,
	CurrentRuleType,
	UserTicketActionType,
	NodeBoardType,
	UserTicketBanLengthType,
	EmojiSettingType,
	ElementSelectType,
} from '@types';

const UserTicketPage = () =>
{
	const { userTicket, denyReasons, rules, actions, boards, ticketUserEmojiSettings,
		banLengths, userEmojiSettings, currentUserEmojiSettings } = useLoaderData() as UserTicketPageProps;

	const noActionAction = actions.find(a => a.identifier === 'no_action');

	const [action, setAction] = useState<UserTicketActionType['identifier']>('no_action');
	const [rule, setRule] = useState<CurrentRuleType['currentRules'][number]['rules'][number] | undefined>(rules.find(c => c !== undefined)?.rules.find(r => r !== undefined));
	const [actionId, setActionId] = useState<UserTicketActionType['id']>(noActionAction ? noActionAction.id : 0);

	const textareaRef = useRef<any>(null);

	const referenceLink = utils.getReferenceLink(userTicket);
	const encodedId = encodeURIComponent(userTicket.id);

	const changeAction = (event: ElementSelectType): void =>
	{
		const actionId = Number(event.target.value);
		const newAction = actions.find(a => a.id === actionId);

		if (newAction)
		{
			setAction(newAction.identifier);
			setActionId(actionId);
		}
	};

	const changeRule = (value: string): void =>
	{
		const ruleId = Number(value);

		let rule = null;

		for (let category of rules)
		{
			rule = category.rules.find(r => r.id === ruleId);

			if (rule)
			{
				break;
			}
		}

		if (rule)
		{
			setRule(rule);
		}
	};

	const getGeneralRemovalText = (): string =>
	{
		switch (userTicket.reference.format)
		{
			case 'markdown':
				return '{color:mediumblue}*content removed*{color}';
			case 'bbcode':
				return '[color=mediumblue]*content removed*[/color]';

			default:
				return '*content removed*';
		}
	};

	const removeSelectedContent = (): void =>
	{
		const { selectionStart, selectionEnd, value } = textareaRef.current;

		textareaRef.current.value = value.slice(0, selectionStart) + getGeneralRemovalText() + value.slice(selectionEnd);
	};

	const removeAllContent = (): void =>
	{
		textareaRef.current.value = getGeneralRemovalText();
	};

	const clearContent = (): void =>
	{
		textareaRef.current.value = '';
	};

	const getMessagesSection = (): React.ReactNode =>
	{
		const encodedId = encodeURIComponent(userTicket.id);

		return (
			<Section key={Math.random()}>
				<Alert type='info'>
					User(s) who submitted the UT cannot answer messages. All non-staff messages on the UT are shown to the violator if the UT is completed. If you need more information from the submitting user(s), send them a ST and link the ST to the UT. If the UT is relatively minor, you can just deny it if it's not obvious what the problem is.
				</Alert>

				<Form
					action='v1/user_ticket/message'
					callback={`/user-ticket/${encodedId}`}
					showButton
				>
					<input type='hidden' name='id' value={userTicket.id} />

					<Form.Group>
						<RichTextArea
							textName='message'
							formatName='format'
							label='Message'
							emojiSettings={currentUserEmojiSettings}
							maxLength={constants.max.comment}
							required
						/>
					</Form.Group>
					<Form.Group>
						<Switch
							name='staffOnly'
							label='Staff Only'
							value={true}
						/>
					</Form.Group>
				</Form>
			</Section>
		);
	};

	return (
		<div className='UserTicketPage'>
			<RequirePermission permission='process-user-tickets'>
				<UserContext.Consumer>
					{user => user &&
						<>
							<Header
								name={`User Ticket #${userTicket.id}`}
								links={
									<>
										<Link to={`/user-tickets`}>
											UT Dashboard
										</Link>

										{!userTicket.formattedClosed &&
											<>
												{!userTicket.assignee &&
													<PermissionsContext.Consumer>
														{permissions =>
														{
															if (permissions.indexOf('process-mod-tickets') !== -1 ||
													![
														constants.staffIdentifiers.mod,
														constants.staffIdentifiers.admin,
														constants.staffIdentifiers.owner,
													].includes(userTicket.violator.group.identifier))
															{
																return <Confirm
																	action='v1/user_ticket/claim'
																	callback={`/user-ticket/${encodedId}`}
																	id={userTicket.id}
																	label='Claim'
																	message='Are you sure you want to claim this UT?'
																/>;
															}
														}}
													</PermissionsContext.Consumer>
												}

												{userTicket.assignee && user.id === userTicket.assignee.id &&
													<>
														{userTicket.status === constants.userTicket.statuses.open &&
															<>
																<Confirm
																	action='v1/user_ticket/release'
																	callback={`/user-ticket/${encodedId}`}
																	id={userTicket.id}
																	label='Release'
																	message='Are you sure you want to release this UT?'
																/>

																<Confirm
																	action='v1/user_ticket/progress'
																	callback={`/user-ticket/${encodedId}`}
																	id={userTicket.id}
																	label='Move to In Progress'
																	message='Are you sure you want to move this UT to In Progress?'
																/>
															</>
														}
														<Confirm
															action='v1/user_ticket/discussion'
															callback={`/user-ticket/${encodedId}`}
															id={userTicket.id}
															label='Move to In Discussion'
															message='Are you sure you want to move this UT to In Discussion?'
														/>
													</>
												}
											</>
										}
									</>
								}
							/>

							<div className='UserTicketPage_info'>
								<div className='UserTicketPage_type'>
									Type: {userTicket.type.description}
								</div>

								<div className='UserTicketPage_violator'>
									Violator: <Link to={`/profile/${encodeURIComponent(userTicket.violator.id)}`}>
										{userTicket.violator.username}
									</Link> (<Link
										to={`/user-tickets?violator=${encodeURIComponent(userTicket.violator.username)}&statusId=All+Statuses`}
									>
										User Log
									</Link>) {userTicket.info && <img
										src={`${constants.AWS_URL}/images/icons/icon_pending.png`}
										title={userTicket.info}
										alt={userTicket.info}
									/>}
								</div>

								<div className='UserTicketPage_referenceId'>
									<>
										Reference ID: {referenceLink ? <Link to={referenceLink}>
											{referenceLink}
										</Link> : 'N/A'}
									</>
								</div>

								<div className='UserTicketPage_content'>
									Reference Content:
									{userTicket.reference.text &&
										<Markup
											text={userTicket.reference.text}
											format={userTicket.reference.format ?
												userTicket.reference.format :
												'markdown'}
											emojiSettings={ticketUserEmojiSettings}
										/>
									}
									{userTicket.reference.url &&
										<div className='UserTicketPage_referenceUrl'>
											<img src={userTicket.reference.url} alt='Reference Image' />
										</div>
									}
								</div>

								<div className='UserTicketPage_assignedTo'>
									Assigned To: {userTicket.assignee ?
										<Link to={`/profile/${userTicket.assignee.id}`}>
											{userTicket.assignee.username}
										</Link>
										:
										'None'
									}
								</div>

								<div className='UserTicketPage_status'>
									Status: {userTicket.status}
								</div>

								<div className='UserTicketPage_submitted'>
									Original Submitter ({userTicket.reportedUsers?.length}): <Link to={`/profile/${userTicket.submitter.id}`}>
										{userTicket.submitter.username}
									</Link> - {userTicket.formattedCreated}
								</div>

								{userTicket.reportedUsers && userTicket.reportedUsers.length > 1 &&
									<div className='UserTicketPage_submitted'>
										All Submitters
										<ul>
											{userTicket.reportedUsers?.map(ru =>
												<li key={ru.username}>
													<Link to={`/profile/${ru.id}`}>
														{ru.username}
													</Link> - {ru.formattedSubmitted}
												</li>,
											)}
										</ul>
									</div>
								}

								{userTicket.formattedClosed &&
									<>
										<div className='UserTicketPage_closed'>
											Closed: {userTicket.formattedClosed}
										</div>

										{userTicket.denyReason ?
											<div className='UserTicketPage_denyReason'>
												Deny Reason: {userTicket.denyReason}
											</div>
											:
											<>
												<div className='UserTicketPage_rule'>
													Rule: {userTicket.rule}
												</div>

												{userTicket.violation &&
													<div className='UserTicketPage_violation'>
														Violation: {userTicket.violation}
													</div>
												}

												<div className='UserTicketPage_action'>
													Action: {userTicket.action.name}
												</div>

												{userTicket.action.identifier === constants.userTicket.actions.modify &&
													<div className='UserTicketPage_updatedContent'>
														Updated Content: <Markup
															text={userTicket.updatedContent}
															format={userTicket.reference.format ?
																userTicket.reference.format :
																'markdown'}
															emojiSettings={ticketUserEmojiSettings}
														/>
													</div>
												}

												<div className='UserTicketPage_ban'>
													Ban Length (w/UT): {userTicket.ban ? userTicket.ban.description : 'Not Banned'}
												</div>

												<div className='UserTicketPage_curentBan'>
													Current Ban Length: {userTicket.currentBan ? userTicket.currentBan.description : 'Not Banned'}
												</div>

												{userTicket.supportTickets.length > 0 &&
													<div className='UserTicketPage_supportTicket'>
														Support Ticket(s): {userTicket.supportTickets.map(st =>
															<React.Fragment key={st.id}>
																<Link to={`/support-ticket/${encodeURIComponent(st.id)}`}>
																	{st.title}
																</Link>{userTicket.supportTickets.length > 1 ? ' ' : ''}
															</React.Fragment>,
														)}
													</div>
												}
											</>
										}
									</>
								}
							</div>

							<div className='UserTicketPage_chat'>
								<h3>Messages: </h3>

								<div className='UserTicketPage_messages'>
									{userTicket.messages.length > 0 ?
										userTicket.messages.map(message =>
											<div key={message.id} className={`UserTicketPage_message ${message.staffOnly && 'staff'}`}>
												<div className='UserTicketPage_messageHeader'>
													<div className='UserTicketPage_messageBy'>
														Message By: <Link to={`/profile/${encodeURIComponent(message.user.id)}`}>
															{message.user.username}
														</Link> on {message.formattedDate} (Staff Only: {message.staffOnly ? 'Yes' : 'No'})
													</div>

													{!message.staffOnly &&
														<div className='UserTicketPage_move'>
															<Confirm
																action='v1/user_ticket/message/move'
																callback={`/user-ticket/${encodedId}`}
																id={message.id}
																label='Move to Staff Notes'
																message='Are you sure you want to move this message?'
															/>
														</div>
													}
												</div>

												<div className='UserTicketPage_message'>
													<Markup
														text={message.message}
														format={message.format ?
															message.format :
															'markdown'}
														emojiSettings={userEmojiSettings?.filter(s => s.userId === message.user.id)}
													/>
												</div>
											</div>,
										)
										:
										'No messages have been posted.'
									}
								</div>
							</div>

							{userTicket.assignee &&
							user.id === userTicket.assignee.id &&
							!userTicket.formattedClosed ?

								<Tabs defaultActiveKey='message' variant='light'>
									<Tabs.Tab eventKey='message' title='Message'>
										{getMessagesSection()}
									</Tabs.Tab>
									<Tabs.Tab eventKey='deny' title='Deny'>
										<Section>
											<Form
												action='v1/user_ticket/deny'
												callback={`/user-ticket/${encodedId}`}
												showButton
												buttonText='Deny'
											>
												<input type='hidden' name='id' value={userTicket.id} />

												<Form.Group>
													<Select
														label='Deny Ticket'
														name='denyReasonId'
														options={denyReasons.filter(r => r.active)}
														optionsMapping={{ value: 'id', label: 'name' }}
														required
													/>
												</Form.Group>
											</Form>
										</Section>
									</Tabs.Tab>
									<Tabs.Tab eventKey='complete' title='Complete'>
										<div className='UserTicketPage_complete'>
											<h3>Complete Ticket:</h3>
											<RequireClientJS fallback={
												<ErrorMessage identifier='javascript-required' />
											}
											>
												<Form
													action='v1/user_ticket/complete'
													callback={`/user-ticket/${encodedId}`}
													showButton
													buttonText='Complete'
												>
													<input type='hidden' name='id' value={userTicket.id} />

													<Form.Group>
														<Select
															label='Select the rule you feel has been violated'
															name='ruleId'
															value={rule ? rule.id : 0}
															changeHandler={changeRule}
															options={rules.map(c => c.rules).flat().filter(r => r.reportable)}
															optionsMapping={{
																value: 'id',
																label: (rule: any) => `${rule.categoryId}.${rule.number} - ${rule.name ? rule.name : rule.description}`,
															}}
															required
															useReactSelect
														/>
													</Form.Group>

													<HTMLPurify
														className='UserTicketPage_ruleDescription'
														html={rule ? rule.description : ''}
														key={Math.random()}
													/>

													{rule && rule.violations.length > 0 &&
															<Form.Group>
																<label>Please select the specific violation that you feel has been violated:</label>
																{rule.violations.map(violation =>
																	<div key={violation.id}>
																		<Checkbox
																			type='radio'
																			name='violationId'
																			value={violation.id}
																			required
																			label={`${violation.severityId ? `${violation.severityId} ` : ''}${violation.violation}`}
																			labelClassName={`severity severity_${violation.severityId}`}
																		/>
																	</div>,
																)}
															</Form.Group>
													}

													<Form.Group>
														<Select
															label='Action'
															name='actionId'
															value={actionId}
															changeHandler={changeAction}
															options={actions}
															optionsMapping={{ value: 'id', label: 'name' }}
															required
														/>
													</Form.Group>

													{action === constants.userTicket.actions.modify &&
															<Form.Group>
																<TextArea
																	name='updatedContent'
																	label='Update Content'
																	value={userTicket.reference.text}
																	textRef={textareaRef}
																/>
																<RequireClientJS>
																	<div className='UserTicketPage_modifyButtons'>
																		<Button
																			clickHandler={removeSelectedContent}
																		>
																			Remove Selected Content
																		</Button>
																		<Button
																			clickHandler={removeAllContent}
																		>
																			Remove All Content
																		</Button>
																		<Button
																			clickHandler={clearContent}
																		>
																			Clear Content
																		</Button>
																	</div>
																</RequireClientJS>
															</Form.Group>
													}

													{action === constants.userTicket.actions.moveThread &&
															<Form.Group>
																<Select
																	label='Move Thread'
																	name='boardId'
																	value={userTicket.reference.boardId ? userTicket.reference.boardId : 0}
																	options={boards}
																	optionsMapping={{ value: 'id', label: 'title' }}
																	required
																/>
															</Form.Group>
													}

													<Form.Group>
														<Select
															label='Current Ban Length'
															name='banLengthId'
															value={userTicket.currentBan?.id}
															options={[{ id: null, description: 'Not Banned' } as any].concat(banLengths)}
															optionsMapping={{ value: 'id', label: 'description' }}
															required
														/>
													</Form.Group>
												</Form>
											</RequireClientJS>
										</div>
									</Tabs.Tab>
								</Tabs>
								:
								getMessagesSection()
							}
						</>
					}
				</UserContext.Consumer>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<UserTicketPageProps>
{
	const [userTicket, denyReasons, rules, actions, boards, banLengths, currentUserEmojiSettings] = await Promise.all([
		this.query('v1/user_ticket', { id: id }),
		this.query('v1/user_ticket/deny_reasons'),
		this.query('v1/rule/current'),
		this.query('v1/user_ticket/actions'),
		this.query('v1/node/boards'),
		this.query('v1/user_ticket/ban_lengths'),
		this.query('v1/settings/emoji'),
	]);

	const [ticketUserEmojiSettings, userEmojiSettings] = await Promise.all([
		this.query('v1/settings/emoji', { userIds: [userTicket.violator.id] }),
		userTicket.messages.length > 0 ? this.query('v1/settings/emoji', { userIds: userTicket.messages.map((m: any) => m.user.id) }) : null,
	]);

	return {
		userTicket,
		denyReasons,
		rules: rules.currentRules,
		actions: actions.filter((a: any) => a.types.includes(userTicket.type.identifier)),
		boards,
		ticketUserEmojiSettings,
		banLengths,
		userEmojiSettings,
		currentUserEmojiSettings,
	};
}

type UserTicketPageProps = {
	userTicket: UserTicketType
	denyReasons: DenyReasonType[]
	rules: CurrentRuleType['currentRules']
	actions: UserTicketActionType[]
	boards: NodeBoardType[]
	ticketUserEmojiSettings: EmojiSettingType[]
	banLengths: UserTicketBanLengthType[]
	userEmojiSettings: EmojiSettingType[] | null
	currentUserEmojiSettings: EmojiSettingType[]
};

export default UserTicketPage;
