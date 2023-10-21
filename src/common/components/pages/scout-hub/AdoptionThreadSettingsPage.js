import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { constants } from '@utils';
import { Form, Text, Select, Check } from '@form';
import { Header, Section, Grid } from '@layout';

const AdoptionThreadSettingsPage = () =>
{
	const {settings} = useLoaderData();

	return (
		<div className='AdoptionThreadSettingsPage'>
			<RequirePermission permission='adoption-bt-settings'>
				<Header
					name='Adoption Buddy Thread Settings'
					links={
						<>
						<Link to={`/scout-hub`}>Scout Hub</Link>
						<Link to={`/scout-hub/new-members`}>New Members</Link>
						<Link to={`/scout-hub/adoption/${constants.boardIds.adopteeBT}`}>
							Adoptee BT
						</Link>
						</>
					}
				/>

				<Section>
					<p>
						Note that all Scouts and Modmins have access by default.
					</p>

					<Form
						action='v1/scout_hub/adoption/save'
						showButton
					>
						<div className='AdoptionThreadSettingsPage_addUserOptions'>
							<Form.Group>
								<Text
									name='username'
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
					<Grid options={settings.users} message='No users.'>
						<Form.Group>
							<Select
								label='List of Users'
								placeholder='List of users'
								options={settings.users}
								optionsMapping={{value: 'id', label: 'username'}}
								multiple
							/>
						</Form.Group>
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData()
{
	const [settings] = await Promise.all([
		this.query('v1/scout_hub/adoption/settings'),
	]);

	return {settings};
}

export default AdoptionThreadSettingsPage;
