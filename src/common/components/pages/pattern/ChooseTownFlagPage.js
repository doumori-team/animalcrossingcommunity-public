import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { Form, Check } from '@form';
import { Header, Section, Grid, Keyboard } from '@layout';

const ChooseTownFlagPage = () =>
{
	const {towns, pattern} = useLoaderData();

	const useTowns = towns.filter(t => t.game.id === pattern.gameId);

	return (
		<div className='ChooseTownFlagPage'>
			<RequireUser permission='modify-towns'>
				<Header name='Patterns' link='/patterns' />

				<Section>
					<Grid name='town' options={useTowns}>
						<Form
							action='v1/town/pattern/save'
							callback='/profile/:userId/towns'
							showButton
						>
							<input type='hidden' name='patternId' value={pattern.id} />

							<Form.Group>
								<Check
									options={useTowns}
									name='id'
									defaultValue={useTowns.length > 0 ? [useTowns[0].id] : []}
									required
									label='Select town that will use this pattern'
									optionsMapping={{
										id: 'id',
										name: (town) => <Keyboard name={town.name} gameId={town.game.id} />,
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

export async function loadData({id})
{
	const [towns, pattern] = await Promise.all([
		this.query('v1/users/towns'),
		this.query('v1/pattern', {id: id}),
	]);

	return {towns, pattern};
}

export default ChooseTownFlagPage;
