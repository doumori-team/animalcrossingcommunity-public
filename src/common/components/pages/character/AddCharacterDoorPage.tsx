import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { ErrorMessage, Section } from '@layout';
import { APIThisType, CharacterType, ACGameType } from '@types';
import { constants, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddCharacterDoorPage = ({ loaderData }: { loaderData: AddCharacterDoorPageProps }) =>
{
	const { character, acgames } = loaderData;

	return (
		<RequireUser id={character.userId} permission='modify-towns'>
			<div className='AddCharacterDoorPage'>
				{
					character.game.id === constants.gameIds.ACGC || character.game.id === constants.gameIds.ACCF ?
						<Section>
							<EditPattern
								acgames={acgames}
								characterId={character.id}
								townId={character.town.id}
								userId={character.userId}
							/>
						</Section>
						:
						<ErrorMessage
							message={`You can't set a house pattern for characters that don't belong to AC:GC or AC:CF.`}
						/>
				}
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { characterId }: { characterId: string }): Promise<AddCharacterDoorPageProps>
{
	const character = await this.query('v1/character', { id: characterId }) as CharacterType;
	const acgames = await Promise.all([
		this.query('v1/acgame', { id: character.game.id }),
	]);

	return { character, acgames };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddCharacterDoorPageProps = {
	character: CharacterType
	acgames: ACGameType[]
};

export default AddCharacterDoorPage;
