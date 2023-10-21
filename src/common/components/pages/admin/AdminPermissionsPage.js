import React from 'react';
import { Link, useAsyncValue, useParams } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Section, Header } from '@layout';
import Permission from '@/components/admin/Permission.js';

const AdminPermissionsPage = () =>
{
	const {permissions, userGroups} = getData(useAsyncValue());
	const {id} = useParams();

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

function renderGroups(userGroups, indent, selectedUserGroupId)
{
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

export async function loadData({id})
{
	const selectedUserGroupId = Number(id || -1);

	return Promise.all([
		selectedUserGroupId >= 0 ?
			this.query('v1/admin/user_group/permissions', {id: selectedUserGroupId}) :
			null,
		this.query('v1/user_groups', {display: 'recursive'}),
	]);
}

function getData(data)
{
	const [permissions, userGroups] = data;

	return {permissions, userGroups};
}

export default AdminPermissionsPage;
