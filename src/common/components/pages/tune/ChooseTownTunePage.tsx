import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Check } from '@form';
import { Header, Section, Grid, Keyboard } from '@layout';
import { APIThisType, TownType } from '@types';

const ChooseTownTunePage = () =>
{
	const {towns, tuneId} = useLoaderData() as ChooseTownTunePageProps;

	return (
		<div className='ChooseTownTunePage'>
			<RequireUser permission='modify-towns'>
				<Header name='Town Tunes' link='/town-tunes' />

				<Section>
					<Grid name='town' options={towns}>
						<Form
							action='v1/town/tune/save'
							callback='/profile/:userId/towns'
							showButton
						>
							<input type='hidden' name='tuneId' value={tuneId} />

							<Form.Group>
								<Check
									options={towns}
									name='id'
									defaultValue={towns.length > 0 ? [towns[0].id] : []}
									required
									label='Select town that will use this tune'
									optionsMapping={{
										id: 'id',
										name: (town:any) => <Keyboard name={town.name} gameId={town.game.id} />,
									}}
								/>
							</Form.Group>
						</Form>
					</Grid>
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<ChooseTownTunePageProps>
{
	const tuneId = Number(id);

	const [towns] = await Promise.all([
		this.query('v1/users/towns'),
	]);

	return {towns, tuneId};
}

type ChooseTownTunePageProps = {
	towns: TownType[]
	tuneId: number
}

export default ChooseTownTunePage;
