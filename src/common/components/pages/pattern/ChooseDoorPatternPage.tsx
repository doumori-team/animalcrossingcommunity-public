import { useContext } from 'react';

import { RequireUser } from '@behavior';
import { Form, Check } from '@form';
import { Header, Section, Grid, Keyboard, ErrorMessage } from '@layout';
import { APIThisType, PatternType, CharacterType } from '@types';
import { constants, routerUtils } from '@utils';
import { UserContext } from '@contexts';

export const action = routerUtils.formAction;

const ChooseDoorPatternPage = ({ loaderData }: { loaderData: ChooseTownFlagPageProps }) =>
{
	const { characters, pattern } = loaderData;
	const userContext = useContext(UserContext);

	// This should never happen with normal site usage, but someone could theoretically get here by just plugging in a pattern ID from any game
	if (pattern.gameId !== constants.gameIds.ACGC && pattern.gameId !== constants.gameIds.ACCF)
	{
		return (
			<div>
				<Header name='Patterns' link='/patterns' />
				<Section>
					<ErrorMessage
						message='Only AC:GC and AC:CF patterns can be used as house patterns.'
					/>
				</Section>
			</div>
		);
	}

	const useCharacters = characters.filter(c => c.game.id === pattern.gameId);

	if (useCharacters.length === 0)
	{
		return (
			<div>
				<Header name='Patterns' link='/patterns' />
				<Section>
					<ErrorMessage
						message={`You have no characters that can use ${pattern.gameShortName} patterns.`}
					/>
				</Section>
			</div>
		);
	}

	return (
		<div className='ChooseDoorPatternPage'>
			<RequireUser permission='modify-towns'>
				<Header name='Patterns' link='/patterns' />

				<Section>
					<Grid name='character' options={useCharacters}>
						<Form
							action='v1/character/pattern/save'
							callback={`/profile/${encodeURIComponent(userContext!.id)}/towns`}
							showButton
						>
							<input type='hidden' name='patternId' value={pattern.id} />

							<Form.Group>
								<Check
									options={useCharacters}
									name='id'
									defaultValue={useCharacters.length > 0 ? [useCharacters[0].id] : []}
									required
									label={`Select character that will use this ${pattern.gameId === constants.gameIds.ACGC ? 'door' : 'house flag'} pattern`}
									optionsMapping={{
										id: 'id',
										name: (character: any) => <Keyboard name={character.name} gameId={character.game.id} />,
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
	const [characters, pattern] = await Promise.all([
		this.query('v1/users/characters'),
		this.query('v1/pattern', { id: id }),
	]);

	return { characters, pattern };
}

export const loader = routerUtils.wrapLoader(loadData);

type ChooseTownFlagPageProps = {
	characters: CharacterType[]
	pattern: PatternType
};

export default ChooseDoorPatternPage;
