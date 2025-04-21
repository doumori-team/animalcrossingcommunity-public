import { getSeason } from 'common/calendar.ts';
import { RequireUser } from '@behavior';
import EditTown from '@/components/towns/EditTown.tsx';
import { Section } from '@layout';
import { APIThisType, TownType, TownGameType, SeasonsType } from '@types';
import { constants, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditTownPage = ({ loaderData }: { loaderData: EditTownPageProps }) =>
{
	const { town, townGame, season } = loaderData;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownPage'>
				<Section>
					<EditTown
						key={town.id}
						gameId={town.game.id}
						town={town}
						gameInfo={townGame}
						season={season}
					/>
				</Section>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { townId }: { townId: string }, { debug }: { debug: string }): Promise<EditTownPageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', { id: townId }),
	]);

	const [info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres, paintColors] = await Promise.all([
		this.query('v1/acgame', { id: town.game.id }),
		this.query('v1/acgame/fruit', { id: town.game.id }),
		this.query('v1/acgame/grass_shape'),
		this.query('v1/acgame/ordinance', { id: town.game.id }),
		this.query('v1/acgame/store', { id: town.game.id }),
		this.query('v1/acgame/pwp', { id: town.game.id }),
		this.query('v1/acgame/resident', { id: town.game.id }),
		this.query('v1/acgame/hemisphere'),
		this.query('v1/acgame/paint', { id: town.game.id }),
	]);

	const season = getSeason(constants.LIVE_SITE ? null : debug);

	return {
		town,
		townGame: { info, fruit, grassShapes, ordinances, stores, pwps, residents, hemispheres, paintColors },
		season,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type EditTownPageProps = {
	town: TownType
	townGame: TownGameType
	season: SeasonsType
};

export default EditTownPage;
