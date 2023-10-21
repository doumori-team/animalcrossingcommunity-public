import React from 'react';
import { Link, useAsyncValue, useParams } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import Town from '@/components/towns/Town.js';
import { UserContext } from '@contexts';
import { Grid, Section } from '@layout';

const UserTownsPage = () =>
{
	const {towns} = getData(useAsyncValue());
	let {userId} = useParams();

	userId = Number(userId);

	return (
		<RequirePermission permission='view-towns'>
			<div className='UserTownsPage'>
				<Grid options={towns} message={
					<UserContext.Consumer>
						{currentUser => (currentUser && currentUser.id === userId) ? (
							<Section>
								{'You have no towns set up. '}
								<RequirePermission permission='modify-towns'><Link to={`/profile/${encodeURIComponent(currentUser.id)}/towns/add`}>Click here</Link>
								{' to add a new town.'}</RequirePermission>
							</Section>
						) : (
							<Section>
								This user has no towns setup.
							</Section>
						)}
					</UserContext.Consumer>
				}>
					{towns.map(town =>
						<Section key={town.id}>
							<Town {...town} />
						</Section>
					)}
				</Grid>
			</div>
		</RequirePermission>
	);
}

export async function loadData({id})
{
	return Promise.all([
		this.query('v1/users/towns', {id}),
	]);
}

function getData(data)
{
	const [towns] = data;

	return {towns};
}

export default UserTownsPage;
