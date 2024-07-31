import React from 'react';
import { Link, useLoaderData, useParams } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Section, Header } from '@layout';
import Permission from '@/components/admin/Permission.tsx';
import { APIThisType, PermissionType, UserGroupType } from '@types';

const AdminPermissionsPage = () =>
{
	const {permissions, userGroups} = useLoaderData() as AdminPermissionsPageProps;
	const {id} = useParams() as {id: string};

	const selectedUserGroupId = Number(id || -1);

	return (
		<RequirePermission permission='permission-admin'>
			<div className='AdminPermissionPage'>
				<Header
					name='Permissions Admin'
				/>

				<Section>
					<p>
						Use this page to modify User Group Permissions.
						If you need to modify a user's permission, go to their profile.
					</p>

					<div className='AdminPermissionsPage_chooseUserGroup'>
						<h3>Choose a User Group:</h3>
						<ul className='AdminPermissionsPage_userGroups'>
							{renderGroups(userGroups, 0, selectedUserGroupId)}
						</ul>
					</div>

					<Permission
						permissions={permissions}
						id={selectedUserGroupId}
						action='v1/admin/user_group/permission/save'
					/>
				</Section>
			</div>
		</RequirePermission>
	);
}

function renderGroups(userGroups: UserGroupType[]|undefined, indent:number, selectedUserGroupId:number) : React.ReactNode
{
	if (userGroups == null)
	{
		return;
	}

	return userGroups.map(userGroup =>
		<React.Fragment key={userGroup.id}>
			<li className={`AdminPermissionsPage_userGroup indent_${indent}`}>
				<Link to={`/admin/permissions/${encodeURIComponent(userGroup.id)}`}
					key={userGroup.id}
					className={selectedUserGroupId === userGroup.id ?
						`selected` : ``}>
					{userGroup.name}
				</Link>
			</li>

			{renderGroups(userGroup.groups, indent+1, selectedUserGroupId)}
		</React.Fragment>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<AdminPermissionsPageProps>
{
	const selectedUserGroupId = Number(id || -1);

	const [permissions, userGroups] = await Promise.all([
		selectedUserGroupId >= 0 ?
			this.query('v1/admin/user_group/permissions', {id: selectedUserGroupId}) :
			null,
		this.query('v1/user_groups', {display: 'recursive'}),
	]);

	return {permissions, userGroups};
}

type AdminPermissionsPageProps = {
	permissions: PermissionType
	userGroups: UserGroupType[]
}

export default AdminPermissionsPage;
