import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTown from '@/components/towns/EditTown.tsx';
import { Section } from '@layout';
import { APIThisType, TownType, TownGameType } from '@types';

const EditTownPage = () =>
{
	const {town, townGame} = useLoaderData() as EditTownPageProps;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownPage'>
				<Section>
					<EditTown
						key={town.id}
						gameId={town.game.id}
						town={town}
						gameInfo={townGame}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, {townId}: {townId: string}) : Promise<EditTownPageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', {id: townId}),
	]);

	const [info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres] = await Promise.all([
		this.query('v1/acgame', {id: town.game.id}),
		this.query('v1/acgame/fruit', {id: town.game.id}),
		this.query('v1/acgame/grass_shape'),
		this.query('v1/acgame/ordinance', {id: town.game.id}),
		this.query('v1/acgame/store', {id: town.game.id}),
		this.query('v1/acgame/pwp', {id: town.game.id}),
		this.query('v1/acgame/resident', {id: town.game.id}),
		this.query('v1/acgame/hemisphere'),
	]);

	return {
		town,
		townGame: {info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres}
	};
}

type EditTownPageProps = {
	town: TownType
	townGame: TownGameType
}

export default EditTownPage;
