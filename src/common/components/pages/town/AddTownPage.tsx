import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTown from '@/components/towns/EditTown.tsx';
import { Section, ACGameButtons } from '@layout';
import { APIThisType, ACGameType, TownGameType } from '@types';

const AddTownPage = () =>
{
	const {acgames, townGame, selectedGameId, userId} = useLoaderData() as AddTownProps;

	return (
		<RequireUser id={userId} permission='modify-towns'>
			<div className='AddTownPage'>
				<Section>
					<ACGameButtons
						acgames={acgames.filter(g => g.hasTown)}
						link={`/profile/${encodeURIComponent(userId)}/towns/add`}
					/>
				</Section>

				{townGame &&
					<Section>
						<EditTown
							key={selectedGameId}
							gameId={selectedGameId}
							gameInfo={townGame}
						/>
					</Section>
				}
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, {id, gameId}: {id: string, gameId: string}) : Promise<AddTownProps>
{
	const selectedGameId = Number(gameId);
	const userId = Number(id);

	const [acgames, info, fruit, grassShapes, ordinances, stores, pwps, residents,
		hemispheres] = await Promise.all([
		this.query('v1/acgames'),
		selectedGameId ? this.query('v1/acgame', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/fruit', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/grass_shape') : null,
		selectedGameId ? this.query('v1/acgame/ordinance', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/store', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/pwp', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/resident', {id: gameId}) : null,
		selectedGameId ? this.query('v1/acgame/hemisphere') : null,
	]);

	return {
		acgames,
		selectedGameId,
		townGame: selectedGameId ? {info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres} : null,
		userId
	};
}

type AddTownProps = {
	acgames: ACGameType[]
	selectedGameId: number
	townGame: TownGameType|null
	userId: number
}

export default AddTownPage;
