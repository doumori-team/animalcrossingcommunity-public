import React from 'react';
import { Link, useAsyncValue, useParams } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import TownSummary from '@/components/towns/TownSummary.tsx';
import { UserContext } from '@contexts';
import { Grid, Section } from '@layout';
import { APIThisType, TownType } from '@types';

const UserTownsPage = () =>
{
	const { towns } = getData(useAsyncValue()) as UserTownsPageProps;
	const { userId } = useParams();

	return (
		<RequirePermission permission='view-towns'>
			<div className='UserTownsPage'>
				<Grid options={towns} message={
					<UserContext.Consumer>
						{currentUser => currentUser && currentUser.id === Number(userId) ?
							<Section>
								{'You have no towns set up. '}
								<RequirePermission permission='modify-towns'><Link to={`/profile/${encodeURIComponent(currentUser.id)}/towns/add`}>Click here</Link>
									{' to add a new town.'}</RequirePermission>
							</Section>
							:
							<Section>
								This user has no towns setup.
							</Section>
						}
					</UserContext.Consumer>
				}
				>
					{towns.map(town =>
						<Section key={town.id}>
							<TownSummary {...town} />
						</Section>,
					)}
				</Grid>
			</div>
		</RequirePermission>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<any>
{
	return Promise.all([
		this.query('v1/users/towns', { id }),
	]);
}

function getData(data: any): UserTownsPageProps
{
	const [towns] = data;

	return { towns };
}

type UserTownsPageProps = {
	towns: TownType[]
};

export default UserTownsPage;
