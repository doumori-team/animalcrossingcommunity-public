import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { getSeason } from 'common/calendar.ts';
import { RequireUser } from '@behavior';
import EditTown from '@/components/towns/EditTown.tsx';
import { Section, ACGameButtons } from '@layout';
import { APIThisType, ACGameType, TownGameType, SeasonsType } from '@types';
import { constants } from '@utils';

const AddTownPage = () =>
{
	const { acgames, townGame, selectedGameId, userId, season } = useLoaderData() as AddTownProps;

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
							season={season}
						/>
					</Section>
				}
			</div>
		</RequireUser>
	);
};

export async function loadData(this: APIThisType, { id, gameId }: { id: string, gameId: string }, { debug }: { debug: string }): Promise<AddTownProps>
{
	const selectedGameId = Number(gameId);
	const userId = Number(id);

	const [acgames, info, fruit, grassShapes, ordinances, stores, pwps, residents,
		hemispheres, paintColors] = await Promise.all([
		this.query('v1/acgames'),
		selectedGameId ? this.query('v1/acgame', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/fruit', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/grass_shape') : null,
		selectedGameId ? this.query('v1/acgame/ordinance', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/store', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/pwp', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/resident', { id: gameId }) : null,
		selectedGameId ? this.query('v1/acgame/hemisphere') : null,
		selectedGameId ? this.query('v1/acgame/paint', { id: gameId }) : null,
	]);

	const season = getSeason(constants.LIVE_SITE ? null : debug);

	return {
		acgames,
		selectedGameId,
		townGame: selectedGameId ? { info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres, paintColors } : null,
		userId,
		season,
	};
}

type AddTownProps = {
	acgames: ACGameType[]
	selectedGameId: number
	townGame: TownGameType | null
	userId: number
	season: SeasonsType
};

export default AddTownPage;
