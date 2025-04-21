import { RequireClientJS, RequirePermission } from '@behavior';
import { Form, Switch, Text, Checkbox, Check, Select } from '@form';
import { constants, routerUtils } from '@utils';
import { Section, Grid } from '@layout';
import {
	APIThisType,
	UserLiteType,
	AccountSettingType,
	CalendarSettingType,
	ACGameType,
	HemisphereType,
	HeaderSettingType,
} from '@types';

export const action = routerUtils.formAction;

const AccountSettingsPage = ({ loaderData }: { loaderData: AccountSettingsPageProps }) =>
{
	const {
		email, showBirthday, showAge, acgames, settings, hemispheres,
		showEmail, emailNotifications, blockedUsers, showStaff, shopDNC,
		southernHemisphere, stayForever, userSiteHeaders, consolidateCalendars,
	} = loaderData;

	return (
		<div className='AccountSettingsPage'>
			<Section>
				<Form action='v1/settings/account/save' showButton buttonText='Save'>
					<Form.Group>
						<Text
							type='email'
							name='email'
							value={email}
							label='Email'
							pattern={constants.regexes.email}
							placeholder='123@abc.com'
							required
							hideTrailingPlaceholder
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showBirthday'
							label='Show my birthday on my profile'
							value={showBirthday}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showAge'
							label='Show my age on my profile'
							value={showAge}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showEmail'
							label='Show my email address on my profile'
							value={showEmail}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='emailNotifications'
							label='Allow ACC to send me email notifications'
							value={emailNotifications}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='showStaff'
							label='Always include staff members in my buddy list'
							value={showStaff}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='shopDNC'
							label='Shop DNC'
							value={shopDNC}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='southernHemisphere'
							label='Use southern hemisphere layout'
							value={southernHemisphere}
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='stayForever'
							label='Stay signed in forever'
							value={stayForever}
							information="Only turn 'Stay signed in forever' on if you use a private device - a device that no one else uses - to access ACC. This will keep you logged in to ACC on that device for 1 year after you were last active on the site."
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<Switch
							name='consolidateCalendars'
							label='Merge home screen calendars'
							value={consolidateCalendars}
							information="If you have multiple games selected in your homepage calendar settings (down below), enabling 'Merge home screen calendars' will group events for all games by type. Disabling this will separate your calendars by game."
							switchFirst
						/>
					</Form.Group>

					<Form.Group>
						<div className='AccountSettingsPage_awayContainer'>
							<label>Set me to away: </label>

							<div className='AccountSettingsPage_away'>
								<Text
									type='date'
									name='awayStartDate'
									label='Date leaving'
									hideLabels
								/> to <Text
									type='date'
									name='awayEndDate'
									label='Date returning'
									hideLabels
								/>
							</div>
						</div>
					</Form.Group>
				</Form>
			</Section>

			<Section>
				<h2>Site header</h2>

				<p>Choose which links you'd like in your site header.</p>

				<p>You are responsible for choosing the right setup that works for your device(s). Some of the links you choose may not appear if your screen is too small.</p>

				<div className='AccountSettingsPage_siteHeader'>
					<Form action='v1/settings/header/save' showButton buttonText='Save'>
						{userSiteHeaders.map(header =>
							<Form.Group key={header.id}>
								<Checkbox
									type='checkbox'
									name='headerIds'
									checked={header.granted}
									value={header.id}
									label={header.name}
								/>
							</Form.Group>,
						)}
					</Form>
				</div>
			</Section>

			<RequirePermission permission='change-username' silent>
				<Section>
					<h2>Username change</h2>

					<p>User names must be between 3 and 15 characters, and cannot contain spaces or special characters. Only numbers, letters, and underscores are allowed.</p>

					<Form action='v1/settings/username/save' showButton buttonText='Save'>
						<Form.Group>
							<Text
								name='username'
								label='New username'
								required
								pattern={constants.regexes.username}
								maxLength={constants.max.username}
								minLength={constants.min.username}
							/>
						</Form.Group>
					</Form>
				</Section>
			</RequirePermission>

			<RequireClientJS>
				<Section>
					<h2>Reset Password</h2>

					<p>This will redirect you to the form where you can update your password.</p>

					<Form
						action='v1/users/reset_password'
						showButton
						buttonText='Reset Password'
					/>
				</Section>
			</RequireClientJS>

			<Section>
				<h2>Block or unblock users</h2>

				<div className='AccountSettingsPage_users'>
					<Grid options={blockedUsers} message='No users blocked.'>
						<Form.Group>
							<Select
								label='List of Blocked Users'
								placeholder='List of blocked users'
								options={blockedUsers}
								optionsMapping={{ value: 'id', label: 'username' }}
								multiple
							/>
						</Form.Group>
					</Grid>
				</div>

				<Form
					action='v1/users/block/save'
					className='AccountSettingsPage_blockUser'
					showButton
					buttonText='Save'
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
			</Section>

			<Section>
				<h2>Homepage calendar content</h2>

				<Form action='v1/settings/calendar/save' showButton buttonText='Save'>
					<ul className='AccountSettingsPage_games'>
						{acgames.filter(g => g.hasTown).map(acGame =>
						{
							const setting = settings.games.find(g => g.id === acGame.id);

							return (
								<li key={acGame.id}>
									<Checkbox
										name='gameIds'
										value={acGame.id}
										checked={setting ? setting.homepage : false}
										label={acGame.name}
										htmlFor={`game_${acGame.id.toString()}`}
										labelClassName='AccountSettingsPage_ACGame'
									/>

									{acGame.id === constants.gameIds.ACNH &&
										<ul>
											<li>
												{hemispheres.map(hemisphere =>
													<Checkbox
														key={hemisphere.id}
														name='hemisphereId'
														value={hemisphere.id}
														checked={setting ? setting.hemisphereId === hemisphere.id : false}
														label={`${hemisphere.name} Hemisphere`}
														htmlFor={`hemi_${hemisphere.id.toString()}`}
														type='radio'
													/>,
												)}
											</li>
										</ul>
									}

									<ul>
										<li>
											{settings.categories
										.filter(c => acGame.id === constants.gameIds.ACGC && c.identifier !== 'birthdays' ||
											acGame.id !== constants.gameIds.ACGC)
										.map(category =>
											<Checkbox
												key={category.id}
												name='categories'
												value={`${acGame.id}_${category.id}`}
												checked={setting ? setting.categoryIds.includes(category.id) : false}
												label={category.name}
												htmlFor={`cat_${acGame.id}_${category.id.toString()}`}
											/>,
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
};

async function loadData(this: APIThisType): Promise<AccountSettingsPageProps>
{
	const [results, acgames, settings, hemispheres, blockedUsers, userSiteHeaders] = await Promise.all([
		this.query('v1/settings/account'),
		this.query('v1/acgames'),
		this.query('v1/settings/calendar'),
		this.query('v1/acgame/hemisphere'),
		this.query('v1/users/block/users'),
		this.query('v1/settings/header'),
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
		showStaff: results.showStaff,
		shopDNC: results.shopDNC,
		southernHemisphere: results.southernHemisphere,
		stayForever: results.stayForever,
		userSiteHeaders: userSiteHeaders,
		consolidateCalendars: results.consolidateCalendars,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type AccountSettingsPageProps = {
	email: AccountSettingType['email']
	showBirthday: AccountSettingType['showBirthday']
	showAge: AccountSettingType['showAge']
	showEmail: AccountSettingType['showEmail']
	acgames: ACGameType[]
	settings: CalendarSettingType
	hemispheres: HemisphereType[]
	emailNotifications: AccountSettingType['emailNotifications']
	blockedUsers: UserLiteType[]
	showStaff: AccountSettingType['showStaff']
	shopDNC: AccountSettingType['shopDNC']
	southernHemisphere: AccountSettingType['southernHemisphere']
	stayForever: AccountSettingType['stayForever']
	userSiteHeaders: HeaderSettingType[]
	consolidateCalendars: AccountSettingType['consolidateCalendars']
};

export default AccountSettingsPage;
