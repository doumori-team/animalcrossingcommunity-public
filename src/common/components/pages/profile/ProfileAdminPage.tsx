import React from 'react';
import { useLoaderData, useOutletContext } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { utils } from '@utils';
import { Form, Select } from '@form';
import Permission from '@/components/admin/Permission.tsx';
import { Header, Section } from '@layout';
import { APIThisType, PermissionType, UserGroupType, BanLengthType, UserType } from '@types';

const ProfileAdminPage = () =>
{
	const { permissions, userGroups, banLength } = useLoaderData() as ProfileAdminPageProps;
	const { user } = useOutletContext() as { user: UserType };

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

				<Section>
					<Form
						action='v1/view_information'
						showButton
						buttonText='View Information'
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
								optionsMapping={{ value: 'id', label: 'name' }}
								key={user.group.id}
							/>
						</Form.Group>
					</Form>

					{permissions != null &&
						<Permission
							permissions={permissions}
							id={user.id}
							action='v1/admin/users/permission/save'
						/>
					}
				</RequirePermission>
			</div>
		</RequirePermission>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<ProfileAdminPageProps>
{
	const [permissions, userGroups, banLength] = await Promise.all([
		this.query('v1/users/permissions', { id }),
		this.query('v1/user_groups'),
		this.query('v1/users/ban_length', { id }),
	]);

	return { permissions, userGroups, banLength };
}

type ProfileAdminPageProps = {
	permissions: PermissionType | null
	userGroups: UserGroupType[]
	banLength: BanLengthType | null
};

export default ProfileAdminPage;
