import { useState } from 'react';
import { Link } from 'react-router';

import { RequireUser, RequireTestSite, RequireClientJS } from '@behavior';
import { Form, Check, Text, Select } from '@form';
import { Header, Section } from '@layout';
import { constants, routerUtils } from '@utils';
import { APIThisType, NodeBoardType, ACGameType, ViewEmailType, TreasureType } from '@types';
import TreasureOffer from '@/components/layout/TreasureOffer.tsx';

export const action = routerUtils.formAction;

const AutomationPage = ({ loaderData }: { loaderData: AutomationPageProps }) =>
{
	const { boards, acgames } = loaderData;

	const [latestEmail, setLatestEmail] = useState<ViewEmailType | null>(null);
	const [treasure, setTreasure] = useState<TreasureType | null>(null);

	return (
		<RequireTestSite>
			<RequireUser>
				<div className='AutomationPage'>
					<Header name='Automation' />

					<Section>
						<p>
							<strong>
								Warning: Please note that there may be certain limits on data for test sites, so we ask anyone using these tools not go crazy. If in doubt, please don't hesitate to contact the development leads.
							</strong>
						</p>

						<div className='AutomationPage_sectionName'>
							Bell System
						</div>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/bell_system/bells' showButton>
								<Form.Group>
									<Check
										options={constants.addRemoveOptions}
										name='action'
										defaultValue={['add']}
										label='Add / Remove Bells'
									/>
									<Text
										type='number'
										name='amount'
										max={10000000}
										label='Amount'
										placeholder='Amount'
										hideLabels
									/>
								</Form.Group>
							</Form>

							<hr/>

							<Form action='v1/automation/bell_system/jackpot/set' showButton>
								<Form.Group>
									<Text
										type='number'
										name='amount'
										max={500000}
										label='Set Jackpot'
									/>
								</Form.Group>
							</Form>

							<hr/>

							<Form
								action='v1/automation/bell_system/jackpot/claim'
								showButton
								buttonText='Claim Jackpot'
							/>

							<hr />

							<Form action='v1/automation/bell_system/miss' showButton>
								<Form.Group>
									<Select
										name='type'
										label='Miss Bells'
										options={[
											{ value: 100, label: '100' },
											{ value: 1000, label: '1000' },
											{ value: 10000, label: '10000' },
											{ value: 'jackpot', label: 'Jackpot' },
										]}
									/>
								</Form.Group>
							</Form>

							<hr />

							<Form action='v1/automation/bell_system/shop/reset' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label="Reset User's Purchases"
									/>
								</Form.Group>
							</Form>

							<hr />

							<Form action='v1/automation/bell_system/shop/expire' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label="Expire User's Purchases"
									/>
								</Form.Group>
							</Form>

							<RequireClientJS>
								<hr />

								<div className='AutomationPage_sectionOption'>
									<Form
										action='v1/automation/other/treasure'
										showButton
										buttonText='Create Treasure'
										updateFunction={(data: TreasureType) => setTreasure(data)}
									/>

									{treasure &&
										<TreasureOffer size='728x90' treasure={treasure} />
									}
								</div>
							</RequireClientJS>
						</div>
					</Section>

					<Section>
						<div className='AutomationPage_sectionName'>
							Create Mass Content
						</div>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/content/threads' showButton>
								<Form.Group>
									<label htmlFor='threads'>
										Add X Thread(s) With Y Post(s):
									</label>
									<Text
										type='number'
										name='threads'
										max={200}
										label='Threads'
										hideLabels
										placeholder='Threads'
									/>
									<Text
										type='number'
										name='posts'
										max={50}
										label='Posts'
										hideLabels
										placeholder='Posts'
									/>
									<Select
										name='boardId'
										label='Board ID'
										hideLabels
										options={boards}
										optionsMapping={{ value: 'id', label: 'title' }}
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/content/tunes' showButton>
								<Form.Group>
									<Text
										type='number'
										name='amount'
										max={100}
										label='Add X Town Tunes'
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/content/patterns' showButton>
								<Form.Group>
									<Text
										type='number'
										name='amount'
										max={100}
										label='Add X Patterns'
									/>
								</Form.Group>
							</Form>
						</div>
					</Section>

					<Section>
						<div className='AutomationPage_sectionName'>
							Other
						</div>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/town' showButton>
								<Form.Group>
									<Select
										name='gameId'
										label='Setup Town, Character, FC in Game'
										options={acgames.filter(g => g.hasTown)}
										optionsMapping={{ value: 'id', label: 'name' }}
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/rating' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label='Give WiFi Rating'
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/reset_scout' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label='Reset Scout for X New Member'
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/reset_username_history' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label="Reset Test Account's Username History"
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/remove_ban' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label='Remove All Bans'
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/delete_user' showButton>
								<Form.Group>
									<Text
										maxLength={constants.max.searchUsername}
										name='username'
										label='Delete Test Account'
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/donate' showButton>
								<Form.Group>
									<Check
										options={constants.addRemoveOptions}
										name='donateAction'
										defaultValue={['add']}
										label='Add / Remove Donations'
									/>
									<Text
										type='number'
										name='amount'
										max={10000000}
										label='Amount'
										placeholder='Amount'
										hideLabels
									/>
								</Form.Group>
							</Form>
						</div>

						<hr/>

						<RequireClientJS>
							<div className='AutomationPage_sectionOption'>
								<p>
									To see an email, simply go to devtest@animalcrossingcommunity.com (see <Link to='https://www.animalcrossingcommunity.com/forums/6053324/1'>ACC Developer Thread</Link> for access) and setup the forwarding (Settings &gt; Forwarding and POP/IMAP) to be the 'devmail' email (if on review app) or the 'stagemail' email (if on staging). If on review app, have Administrator update the account's website SendGrid app &gt; Settings &gt; Inbound Parse to be your review app url. Then any email sent to devtest will go to that location; you can also manually forward to the devmail/stagemail address. Then you can click 'View Latest Email' below to see the email.
								</p>

								<Form
									action='v1/automation/other/view_email'
									showButton
									buttonText='View Latest Email'
									updateFunction={(data: ViewEmailType | null) => setLatestEmail(data)}
								/>

								{!!latestEmail &&
									<div className='AutomationPage_sectionInfo'>
										<div>Date: {latestEmail.recorded}</div>
										<div>From: {latestEmail.from}</div>
										<div>Subject: {latestEmail.subject}</div>
										<div>Body:
											<br/>
											{latestEmail.body}</div>
									</div>
								}
							</div>

							<hr/>
						</RequireClientJS>

						<Form
							action='v1/automation/other/shop'
							showButton
							buttonText='Create Shop'
						/>

						<hr/>

						<div className='AutomationPage_sectionOption'>
							<Form action='v1/automation/other/trading_post' showButton>
								<div className='AutomationPaga_options'>
									<label htmlFor='step'>
										Advanced Trading Post:
									</label>

									<Form.Group>
										<Select
											name='step'
											label='Step'
											options={[
												{ value: 'create_trade', label: 'Create Trade' },
												{ value: 'make_offers', label: 'Make Offers' },
												{ value: 'accept_offer', label: 'Accept Offer' },
												{ value: 'share_info', label: 'Share Info (Contacts / FCs)' },
												{ value: 'complete_trade', label: 'Complete Trade' },
												{ value: 'submit_feedback', label: 'Submit Feedback' },
											]}
											hideLabels
											required
										/>
									</Form.Group>
									<Form.Group>
										<Select
											name='gameId'
											label='Game'
											options={[
												{ id: 'real-world', name: 'Real-World' } as any,
											].concat(acgames.filter(g => g.hasTown))}
											optionsMapping={{ value: 'id', label: 'name' }}
											hideLabels
										/>
									</Form.Group>
									<Form.Group>
										<Text
											type='number'
											name='listingId'
											label='Listing ID'
											hideLabels
											placeholder='Listing ID'
										/>
									</Form.Group>
								</div>
							</Form>
						</div>
					</Section>
				</div>
			</RequireUser>
		</RequireTestSite>
	);
};

async function loadData(this: APIThisType): Promise<AutomationPageProps>
{
	const [boards, acgames] = await Promise.all([
		this.query('v1/node/boards'),
		this.query('v1/acgames'),
	]);

	return { boards, acgames };
}

export const loader = routerUtils.wrapLoader(loadData);

type AutomationPageProps = {
	boards: NodeBoardType[]
	acgames: ACGameType[]
};

export default AutomationPage;
