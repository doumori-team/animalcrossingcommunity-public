import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import ReactDomServer from 'react-dom/server';

import { RequireUser } from '@behavior';
import EditCharacter from '@/components/characters/EditCharacter.tsx';
import { Keyboard, Section, Grid } from '@layout';
import { APIThisType, TownType, CharacterGameType } from '@types';

const AddCharacterPage = () =>
{
	const { towns, selectedTownId, characterGame, userId } = useLoaderData() as AddCharacterPageProps;

	const encodedId = encodeURIComponent(userId);
	const town = characterGame ? towns.find(t => t.id === selectedTownId) : null;

	return (
		<RequireUser id={userId} permission='modify-towns'>
			<div className='AddCharacterPage'>
				<Section>
					<h3>Choose a Town:</h3>

					<Grid options={towns} message={
						<>
							{'You have no towns set up. Go to your '}
							<Link to={`/profile/${encodedId}/towns/add`}>add towns page</Link>
							{' to setup a town.'}
						</>
					}
					>
						{towns.map(town =>
							<Link
								to={`/profile/${encodedId}/characters/add/${encodeURIComponent(town.id)}`}
								key={town.id}
								className={`ACGameButtons_game ACGameButtons_game_${town.game.identifier}`}
								aria-label={ReactDomServer.renderToString(
									<>
										<Keyboard
											name={town.name}
											gameId={town.game.id}
										/> ({town.game.shortname})
									</>,
								)}
							>
								<p>
									<Keyboard
										name={town.name}
										gameId={town.game.id}
									/> ({town.game.shortname})
								</p>
							</Link>,
						)}
					</Grid>
				</Section>

				{characterGame && !!town &&
					<Section>
						<EditCharacter
							key={selectedTownId}
							town={town}
							gameInfo={characterGame}
						/>
					</Section>
				}
			</div>
		</RequireUser>
	);
};

export async function loadData(this: APIThisType, { id, townId }: { id: string, townId?: string }): Promise<AddCharacterPageProps>
{
	const selectedTownId = Number(townId);
	const userId = Number(id);

	let characterGame = null;

	const [towns, town] = await Promise.all([
		this.query('v1/users/towns'),
		selectedTownId ? this.query('v1/town', { id: townId }) : null,
	]);

	if (selectedTownId)
	{
		const [info, houseSizes, bedLocations, faces, paintColors, monuments] = await Promise.all([
			this.query('v1/acgame', { id: town.game.id }),
			this.query('v1/acgame/house_size', { id: town.game.id }),
			this.query('v1/acgame/bed_location', { id: town.game.id }),
			this.query('v1/acgame/face', { id: town.game.id }),
			this.query('v1/acgame/paint', { id: town.game.id }),
			this.query('v1/acgame/monument', { id: town.game.id }),
		]);

		characterGame = { info, houseSizes, bedLocations, faces, paintColors, monuments };
	}

	return { towns, selectedTownId, characterGame, userId };
}

type AddCharacterPageProps = {
	towns: TownType[]
	selectedTownId: number
	characterGame: CharacterGameType | null
	userId: number
};

export default AddCharacterPage;
