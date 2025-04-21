import { use } from 'react';
import { Link, Params } from 'react-router';

import { RequirePermission } from '@behavior';
import TownSummary from '@/components/towns/TownSummary.tsx';
import { UserContext } from '@contexts';
import { Grid, Section } from '@layout';
import { APIThisType, TownType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const UserTownsPage = ({ loaderData, params }: { loaderData: Promise<UserTownsPageProps>, params: Params }) =>
{
	const { towns } = getData(use(loaderData));
	const { id } = params;

	return (
		<RequirePermission permission='view-towns'>
			<div className='UserTownsPage'>
				<Grid options={towns} message={
					<UserContext.Consumer>
						{currentUser => currentUser && currentUser.id === Number(id) ?
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

async function loadData(this: APIThisType, { id }: { id: string }): Promise<any>
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

export const loader = routerUtils.deferLoader(loadData);

type UserTownsPageProps = {
	towns: TownType[]
};

export default routerUtils.LoadingFunction(UserTownsPage);
