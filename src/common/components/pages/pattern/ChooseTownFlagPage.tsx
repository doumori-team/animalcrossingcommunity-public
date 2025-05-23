import { RequireUser } from '@behavior';
import { Form, Check } from '@form';
import { Header, Section, Grid, Keyboard } from '@layout';
import { APIThisType, TownType, PatternType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const ChooseTownFlagPage = ({ loaderData }: { loaderData: ChooseTownFlagPageProps }) =>
{
	const { towns, pattern } = loaderData;

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
										name: (town: any) => <Keyboard name={town.name} gameId={town.game.id} />,
									}}
								/>
							</Form.Group>
						</Form>
					</Grid>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<ChooseTownFlagPageProps>
{
	const [towns, pattern] = await Promise.all([
		this.query('v1/users/towns'),
		this.query('v1/pattern', { id: id }),
	]);

	return { towns, pattern };
}

export const loader = routerUtils.wrapLoader(loadData);

type ChooseTownFlagPageProps = {
	towns: TownType[]
	pattern: PatternType
};

export default ChooseTownFlagPage;
