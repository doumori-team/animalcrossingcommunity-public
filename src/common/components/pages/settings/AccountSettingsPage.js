import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Form, Switch, Text, Checkbox, Check, Select } from '@form';
import { constants } from '@utils';
import { Section, Grid } from '@layout';

const AccountSettingsPage = () =>
{
	const {email, showBirthday, showAge, acgames, settings, hemispheres,
		showEmail, emailNotifications, blockedUsers} = useLoaderData();

	return (
		<div className='AccountSettingsPage'>
			<Section>
				<Form action='v1/settings/account/save' showButton>
					<Form.Group>
						<Text
							type='email'
							name='email'
							value={email}
							label='Email'
							pattern={constants.regexes.email}
							placeholder='123@abc.com'
							required
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showBirthday'
							label='Show Birthday'
							value={showBirthday}
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showAge'
							label='Show Age'
							value={showAge}
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showEmail'
							label='Show Email'
							value={showEmail}
						/>
					</Form.Group>

					<Form.Group>
						<label>Set Me To Away: </label>

						<div className='AccountSettingsPage_away'>
							<Text
								type='date'
								name='awayStartDate'
								label='Away Start Date'
								hideLabel
							/> to <Text
								type='date'
								name='awayEndDate'
								label='Away End Date'
								hideLabel
							/>
						</div>
					</Form.Group>

					<Form.Group>
						<Switch
							name='emailNotifications'
							label='Email Notifications'
							value={emailNotifications}
						/>
					</Form.Group>
				</Form>
			</Section>

			<RequirePermission permission='change-username' silent>
				<Section>
					<h2>Username Change</h2>

					<p>User names must be between 3 and 15 characters, and cannot contain spaces or special characters. Only numbers, letters, and underscores are allowed.</p>

					<Form action='v1/settings/username/save' showButton>
						<Form.Group>
							<Text
								name='username'
								label='New Username'
								required
								pattern={constants.regexes.username}
								maxLength={constants.max.username}
								minLength={constants.min.username}
							/>
						</Form.Group>
					</Form>
				</Section>
			</RequirePermission>

			<Section>
				<h3>Block User:</h3>
				<Form
					action='v1/users/block/save'
					className='AccountSettingsPage_blockUser'
					showButton
				>
					<div className='AccountSettingsPage_addUserOptions'>
						<Form.Group>
							<Text
								name='user'
								label='User'
								required
								maxLength={constants.max.searchUsername}
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

				<div className='AccountSettingsPage_users'>
					<Grid options={blockedUsers} message='No users blocked.'>
						<Form.Group>
							<Select
								label='List of Blocked Users'
								placeholder='List of blocked users'
								options={blockedUsers}
								optionsMapping={{value: 'id', label: 'username'}}
								multiple
							/>
						</Form.Group>
					</Grid>
				</div>
			</Section>

			<Section>
				<h2>Calendar Settings</h2>

				<Form action='v1/settings/calendar/save' showButton>
					<ul>
					{acgames.filter(g => g.hasTown).map(acGame => {
						const setting = settings.games.find(g => g.id === acGame.id);

						return (
							<li key={acGame.id}>
								<Checkbox
									type='radio'
									name='gameId'
									value={acGame.id}
									checked={setting ? setting.homepage : false}
									label={acGame.name}
								/>

								{acGame.id === constants.gameIds.ACNH && (
									<ul>
										<li>
										{hemispheres.map(hemisphere =>
											<Checkbox
												key={hemisphere.id}
												type='radio'
												name='hemisphereId'
												value={hemisphere.id}
												checked={setting ? setting.hemisphereId === hemisphere.id : false}
												label={hemisphere.name}
											/>
										)}
										</li>
									</ul>
								)}

								<ul>
									<li>
									{settings.categories
										.filter(c => (acGame.id === constants.gameIds.ACGC && c.identifier !== 'birthdays') ||
											acGame.id !== constants.gameIds.ACGC)
										.map(category =>
										<Checkbox
											key={category.id}
											name='categories'
											value={`${acGame.id}_${category.id}`}
											checked={setting ? setting.categoryIds.includes(category.id) : false}
											label={category.name}
										/>
									)}
									</li>
								</ul>
							</li>
						);
					})}
					</ul>
				</Form>
			</Section>
		</div>
	);
}

export async function loadData()
{
	const [results, acgames, settings, hemispheres, blockedUsers] = await Promise.all([
		this.query('v1/settings/account'),
		this.query('v1/acgames'),
		this.query('v1/settings/calendar'),
		this.query('v1/acgame/hemisphere'),
		this.query('v1/users/block/users'),
	]);

	return {
		email: results.email,
		showBirthday: results.showBirthday,
		showAge: results.showAge,
		showEmail: results.showEmail,
		acgames,
		settings,
		hemispheres,
		emailNotifications: results.emailNotifications,
		blockedUsers,
	};
}

export default AccountSettingsPage;