import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditCharacter from '@/components/characters/EditCharacter.js';
import { Section } from '@layout';

const EditCharacterPage = () =>
{
	const {character, characterGame} = useLoaderData();

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
}

export async function loadData({characterId})
{
	const character = await this.query('v1/character', {id: characterId});

	const [info, houseSizes, bedLocations, faces] = await Promise.all([
		this.query('v1/acgame', {id: character.game.id}),
		this.query('v1/acgame/house_size', {id: character.game.id}),
		this.query('v1/acgame/bed_location', {id: character.game.id}),
		this.query('v1/acgame/face', {id: character.game.id}),
	]);

	return {
		character,
		characterGame: {info, houseSizes, bedLocations, faces}
	};
}

export default EditCharacterPage;
