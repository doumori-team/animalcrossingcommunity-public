import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Section, Header, Tabs } from '@layout';
import { constants } from '@utils';
import { Form, Text, Select, Switch, Check } from '@form';

const EmployeesPage = () =>
{
	const {shop, employees, shopServices, shopRoles} = useLoaderData();

	const encodedId = encodeURIComponent(shop.id);

	const editRole = (role) =>
	{
		return (
			<Form action='v1/shop/role/save' callback={`/shop/${encodedId}/employees`} showButton>
				<input type='hidden' name='id' value={role ? role.id : 0} />
				<input type='hidden' name='shopId' value={shop.id} />

				<Form.Group>
					<Text
						name='name'
						required
						label='Role Name'
						maxLength={constants.max.shopRoleName}
						value={role ? role.name : ''}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='description'
						required
						label='Role Description'
						maxLength={constants.max.shopRoleDescription}
						value={role ? role.description : ''}
					/>
				</Form.Group>

				<Form.Group>
					<Select
						label='Parent Role'
						name='parentId'
						options={employees.roles}
						optionsMapping={{value: 'id', label: 'name'}}
						placeholder='None'
						value={role ? role.parentId : ''}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='number'
						name='positions'
						required
						label='Total Positions Available'
						max={constants.max.shopMaxPositions}
						value={role ? role.positionsAvailable : 1}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='apply'
						label='Available for Users to Apply To'
						value={role ? role.apply : true}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='contact'
						label={`Role will be added to 'Contact Us' Threads`}
						value={role ? role.contact : false}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='active'
						label='Active'
						value={role ? role.active : false}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='applications'
						label='View Applications'
						value={role ? role.applications : false}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='stats'
						label='View Advanced Statistics'
						value={role ? role.stats : false}
					/>
				</Form.Group>

				<Form.Group>
					<Select
						label='Service(s)'
						name='services'
						multiple
						value={role && role.services.length > 0 ? role.services.map(s => s.id) : []}
						options={shopServices}
						optionsMapping={{value: 'id', label: 'name'}}
						placeholder='Choose service(s)...'
					/>
				</Form.Group>
			</Form>
		);
	}

	const currentEmployees = () =>
	{
		return (
			<Section>
				<h2>Current Employees:</h2>
				<ul>
				{employees.list.map(e =>
					<li>
						<Link to={`/profile/${encodeURIComponent(e.id)}`}>{e.username}</Link> - {e.role}
					</li>
				)}
				</ul>
			</Section>
		);
	}

	const modifyUserRoles = () =>
	{
		return (
			<Section>
				<h2>Modify User Roles:</h2>
				<Form action='v1/shop/roles/save' callback={`/shop/${encodedId}/employees`} showButton>
					<input type='hidden' name='shopId' value={shop.id} />

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
							options={[
								{ id: 'add', name: 'Add / Update Employee' },
								{ id: 'remove', name: 'Remove Employee' },
							]}
							name='action'
							defaultValue={['add']}
							label='Action'
						/>
					</Form.Group>

					<Form.Group>
						<Select
							label='Role(s)'
							name='roles'
							multiple
							options={shopRoles}
							optionsMapping={{value: 'id', label: 'name'}}
							placeholder='Choose role(s)...'
						/>
					</Form.Group>
				</Form>
			</Section>
		);
	}

	const editExistingRoles = () =>
	{
		return (
			employees.roles.map(role =>
				<Section key={role.id}>
					<h2>Edit Existing Role:</h2>
					{editRole(role)}
				</Section>
			)
		);
	}

	return (
		<RequireUser ids={shop.owners.map(o => o.id)} permission='modify-shops'>
			<div className='EmployeesPage'>
				<Header
					name={`${shop.name}: Employees & Roles`}
					link={`/shop/${encodedId}`}
					links={
						<>
						<Link to={`/shop/${encodedId}/services`}>
							Manage Services
						</Link>
						<Link to={`/shop/${encodedId}/edit`}>
							Edit
						</Link>
						</>
					}
				/>

				<Tabs
					defaultActiveKey='modify'
					fallback={
						<>
						{currentEmployees()}
						{modifyUserRoles()}
						{editExistingRoles()}
						<Section>
							<h2>Add New Role:</h2>
							{editRole()}
						</Section>
						</>
					}
				>
					<Tabs.Tab eventKey='employees' title='Current Employees'>
						{currentEmployees()}
					</Tabs.Tab>
					<Tabs.Tab eventKey='modify' title='Modify Users'>
						{modifyUserRoles()}
					</Tabs.Tab>
					<Tabs.Tab eventKey='edit' title='Edit Roles'>
						{editExistingRoles()}
					</Tabs.Tab>
					<Tabs.Tab eventKey='add' title='Add Role'>
						<Section>
							<h2>Add New Role:</h2>
							{editRole()}
						</Section>
					</Tabs.Tab>
				</Tabs>
			</div>
		</RequireUser>
	);
}

export async function loadData({id})
{
	const [shop, employees, shopServices, shopRoles] = await Promise.all([
		this.query('v1/shop', {id: id}),
		this.query('v1/shop/employees', {id: id}),
		this.query('v1/shop/services', {id: id}),
		this.query('v1/shop/roles', {id: id}),
	]);

	return {shop, employees, shopServices, shopRoles,};
}

export default EmployeesPage;
