import React from 'react';
import { useAsyncValue, useOutletContext } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { utils } from '@utils';
import { Form, Select } from '@form';
import Permission from '@/components/admin/Permission.js';
import { Header, Section } from '@layout';

const ProfileAdminPage = () =>
{
	const {permissions, userGroups, banLength} = getData(useAsyncValue());
	const {user} = useOutletContext();

	return (
		<RequirePermission permission='process-user-tickets'>
			<div className='ProfileAdminPage'>
				<Header name={`${utils.getPossessiveNoun(user.username)} Admin Page`} />

				<Section>
					<div className='ProfileAdminPage_ban'>
						User Is Banned: {banLength ? `Yes (${banLength.description})` : 'No'}
					</div>
				</Section>

				<Section>
					<Form
						action='v1/reset_password'
						showButton
						buttonText='Reset Password'
					>
						<input type='hidden' name='id' value={user.id} />
					</Form>
				</Section>

				<RequirePermission permission='permission-admin' silent>
					<Form
						className='ProfileAdminPage_chooseUserGroup'
						action='v1/admin/users/user_group/save'
						showButton
					>
						<input type='hidden' name='userId' value={user.id} />

						<Form.Group>
							<Select
								name='groupId'
								label='User Group'
								value={user.group.id}
								options={userGroups}
								optionsMapping={{value: 'id', label: 'name'}}
								key={user.group.id}
							/>
						</Form.Group>
					</Form>

					<Permission
						permissions={permissions}
						id={user.id}
						action='v1/admin/users/permission/save'
					/>
				</RequirePermission>
			</div>
		</RequirePermission>
	);
}

export async function loadData({id})
{
	return Promise.all([
		this.query('v1/users/permissions', {id}),
		this.query('v1/user_groups'),
		this.query('v1/users/ban_length', {id}),
	]);
}

function getData(data)
{
	const [permissions, userGroups, banLength] = data;

	return {permissions, userGroups, banLength};
}

export default ProfileAdminPage;
