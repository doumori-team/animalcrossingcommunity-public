import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import { Form, Text, Checkbox, Check } from '@form';
import { constants, routerUtils } from '@utils';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { Header, Section, SelectAllCheckbox } from '@layout';
import { APIThisType, BuddiesType } from '@types';

export const action = routerUtils.formAction;

const BuddyPage = ({ loaderData }: { loaderData: BuddyPageProps }) =>
{
	const { buddies, staff } = loaderData;

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
					{buddies.length > 0 ?
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
									{buddies.map((buddy: BuddiesType['buddies'][number]) =>
										<div key={buddy.id} className='BuddyPage_buddy'>
											<Form.Group>
												<Checkbox
													name='buddyUsers'
													label='Remove Buddy'
													value={buddy.username}
													hideLabels
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
												<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${buddy.username}#TextBox`}>
													<img
														src={`${constants.AWS_URL}/images/icons/pt.png`}
														className='BuddyPage_icon'
														alt={`PT ${buddy.username}`}
													/>
												</Link>
											</div>
										</div>,
									)}
								</div>
							</Form>
						</>
						:
						'You have no buddies in your buddy list.'
					}
				</Section>

				{staff.length > 0 &&
					<Section>
						<div className='BuddyPage_buddies'>
							{staff.map(buddy =>
								<div key={buddy.id} className='BuddyPage_buddy'>
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
										<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${buddy.username}#TextBox`}>
											<img
												src={`${constants.AWS_URL}/images/icons/pt.png`}
												className='BuddyPage_icon'
												alt={`PT ${buddy.username}`}
											/>
										</Link>
									</div>
								</div>,
							)}
						</div>
					</Section>
				}
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<BuddyPageProps>
{
	const [results] = await Promise.all([
		this.query('v1/users/buddies'),
	]);

	return {
		buddies: results.buddies,
		staff: results.staff,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type BuddyPageProps = {
	buddies: BuddiesType['buddies']
	staff: BuddiesType['staff']
};

export default BuddyPage;
