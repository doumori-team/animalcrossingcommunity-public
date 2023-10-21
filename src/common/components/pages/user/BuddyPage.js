import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Text, Checkbox, Check } from '@form';
import { constants } from '@utils';
import StatusIndicator from '@/components/nodes/StatusIndicator.js';
import { Header, Section, SelectAllCheckbox } from '@layout';

const BuddyPage = () =>
{
	const {buddies} = useLoaderData();

	return (
		<div className='BuddyPage'>
			<RequireUser permission='use-buddy-system'>
				<Header name='ACC Buddies' />

				<Section>
					<h3>Add a Buddy:</h3>

					<Form
						action='v1/users/buddy/save'
						className='BuddyPage_addUser'
						showButton
					>
						<div className='BuddyPage_addUserOptions'>
							<Form.Group>
								<Text
									name='buddyUsers'
									label='User(s)'
									required
									maxLength={constants.max.addMultipleUsers}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									options={constants.addRemoveOptions}
									name='action'
									defaultValue={['add']}
									label='Action'
								/>
							</Form.Group>
						</div>
					</Form>
				</Section>

				<Section>
					{buddies.length > 0 ? (
						<>
						<SelectAllCheckbox
							name='toggle_buddyUsers'
							label='Check All Users'
							select='.BuddyPage_buddies input[name="buddyUsers"]'
						/>

						<Form
							action='v1/users/buddy/save'
							showButton
							buttonText='Remove Selected Buddies'
						>
							<input type='hidden' name='action' value='remove' />

							<div className='BuddyPage_buddies'>
								{buddies.map(buddy =>
									<div key={buddy.id} className='BuddyPage_buddy'>
										<Form.Group>
											<Checkbox
												name='buddyUsers'
												label='Remove Buddy'
												value={buddy.username}
												hideLabel
											/>
										</Form.Group>

										<div className='BuddyPage_name'>
											<Link to={`/profile/${encodeURIComponent(buddy.id)}`}>
												{buddy.username}
											</Link>
										</div>

										<div className='BuddyPage_lastActive'>
											<StatusIndicator
												lastActiveTime={buddy.lastActiveTime}
												showDate={true}
											/>
										</div>

										<div className='BuddyPage_actions'>
											<Link to={`/forums/${constants.boardIds.privateThreads}?addUsers=${buddy.username}`}>
												<img
													src={`${process.env.AWS_URL}/images/icons/pt.png`}
													className='BuddyPage_icon'
													alt={`PT ${buddy.username}`}
												/>
											</Link>
										</div>
									</div>
								)}
							</div>
						</Form>
						</>
					) : (
						'You have no buddies in your buddy list.'
					)}
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData()
{
	const [buddies] = await Promise.all([
		this.query('v1/users/buddies'),
	]);

	return {buddies};
}

export default BuddyPage;
