import { RequireUser } from '@behavior';
import EditCharacter from '@/components/characters/EditCharacter.tsx';
import { Section } from '@layout';
import { APIThisType, CharacterType, CharacterGameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditCharacterPage = ({ loaderData }: { loaderData: EditCharacterPageProps }) =>
{
	const { character, characterGame } = loaderData;

	return (
		<RequireUser id={character.userId} permission='modify-towns'>
			<div className='EditCharacterPage'>
				<Section>
					<EditCharacter
						key={character.id}
						character={character}
						town={character.town}
						gameInfo={characterGame}
					/>
				</Section>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { characterId }: { characterId: string }): Promise<EditCharacterPageProps>
{
	const character: CharacterType = await this.query('v1/character', { id: characterId });

	const [info, houseSizes, bedLocations, faces, paintColors, monuments] = await Promise.all([
		this.query('v1/acgame', { id: character.game.id }),
		this.query('v1/acgame/house_size', { id: character.game.id }),
		this.query('v1/acgame/bed_location', { id: character.game.id }),
		this.query('v1/acgame/face', { id: character.game.id }),
		this.query('v1/acgame/paint', { id: character.game.id }),
		this.query('v1/acgame/monument', { id: character.game.id }),
	]);

	return {
		character,
		characterGame: { info, houseSizes, bedLocations, faces, paintColors, monuments },
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type EditCharacterPageProps = {
	character: CharacterType
	characterGame: CharacterGameType
};

export default EditCharacterPage;
