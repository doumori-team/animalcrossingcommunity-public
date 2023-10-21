import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { constants } from '@utils';
import StatusIndicator from '@/components/nodes/StatusIndicator.js';
import { ContentBox } from '@layout';
import { UserContext } from '@contexts';

const StaffPage = () =>
{
	const {admins, mods, researchers, devs, scouts, devTL, researcherTL, userGroups} = useLoaderData();

	const format = (user) =>
	{
		return (
			<UserContext.Consumer key={user.id}>
				{currentUser => currentUser ?
					<div>
					<Link to={`/profile/${encodeURIComponent(user.id)}`}>
						{user.username}
					</Link> <StatusIndicator lastActiveTime={user.lastActiveTime} showDate={false} />
					</div>
					:
					<div>
						{user.username} <StatusIndicator lastActiveTime={user.lastActiveTime} showDate={false} />
					</div>
				}
			</UserContext.Consumer>
		);
	}

	const getUserGroupId = (identifier) =>
	{
		return userGroups.find(ug => ug.identifier === identifier)?.id;
	}

	return (
		<div className='StaffPage'>
			<ContentBox>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.admin))}`}>
					Administrators
				</Link>
				<br/>
				{admins.map(admin => format(admin))}
				<br/><br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.mod))}`}>
					Moderators
				</Link>
				<br/>
				{mods.map(mod => format(mod))}
				<br/><br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.researcherTL))}`}>
					Researcher Team Lead(s)
				</Link>
				<br/>
				{researcherTL.map(researcher => format(researcher))}
				<br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.researcher))}`}>
					Researchers
				</Link>
				<br/>
				{researchers.map(researcher => format(researcher))}
				<br/><br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.devTL))}`}>
					Developer Team Lead(s)
				</Link>
				<br/>
				{devTL.map(dev => format(dev))}
				<br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.dev))}`}>
					Developers
				</Link>
				<br/>
				{devs.map(dev => format(dev))}
				<br/><br/>
				<Link
					className='StaffPage_role'
					to={`/staff-roles/${encodeURIComponent(getUserGroupId(constants.staffIdentifiers.scout))}`}>
					Scouts
				</Link>
				<br/>
				{scouts.map(scout => format(scout))}
			</ContentBox>
		</div>
	);
}

export async function loadData()
{
	const [admins, mods, researchers, devs, scouts, devTL, researcherTL,
		userGroups] = await Promise.all([
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.admin}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.mod}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.researcher}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.dev}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.scout}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.devTL}),
		this.query('v1/user_group/users', {group: constants.staffIdentifiers.researcherTL}),
		this.query('v1/user_groups'),
	]);

	return {admins, mods, researchers, devs, scouts, devTL, researcherTL, userGroups};
}

export default StaffPage;