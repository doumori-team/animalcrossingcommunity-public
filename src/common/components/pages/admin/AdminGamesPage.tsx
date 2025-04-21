import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { Confirm } from '@form';
import { Header, Section, Grid } from '@layout';
import { APIThisType, GameConsoleType, GameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AdminGamesPage = ({ loaderData }: { loaderData: AdminGamesPageProps }) =>
{
	const { gameConsole, games } = loaderData;

	return (
		<div className='AdminGamesPage'>
			<RequirePermission permission='games-admin'>
				<Header
					name={`Game Consoles: ${gameConsole.name}`}
					link='/admin/game-consoles'
					links={
						<Link to={`/admin/game-console/${encodeURIComponent(gameConsole.id)}/add-game`}>
							Add New Game
						</Link>
					}
				/>

				<Section>
					<Grid name='game' options={games}>
						{games.map(game =>
							<div key={game.id} className='AdminGameConsolesPage_game'>
								<div className='AdminGameConsolesPage_gameLinks'>
									<Link to={`/admin/game/${encodeURIComponent(game.id)}/edit`}>
										Edit
									</Link>

									<Confirm
										action='v1/admin/game/destroy'
										callback={`/admin/game-console/${gameConsole.id}`}
										label='Delete'
										message='Are you sure you want to delete this game?'
										id={game.id}
										formId={`game-destroy-${game.id}`}
									/>
								</div>
								{game.name}
							</div>,
						)}
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<AdminGamesPageProps>
{
	const [gameConsole, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', { id }),
		this.query('v1/admin/game_console/games', { id }),
	]);

	return { gameConsole, games };
}

export const loader = routerUtils.wrapLoader(loadData);

type AdminGamesPageProps = {
	gameConsole: GameConsoleType
	games: GameType[]
};

export default AdminGamesPage;
