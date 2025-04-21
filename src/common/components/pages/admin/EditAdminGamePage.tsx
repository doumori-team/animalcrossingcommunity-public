import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGame from '@/components/admin/EditGame.tsx';
import { APIThisType, GameConsoleType, GameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditAdminGamePage = ({ loaderData }: { loaderData: EditAdminGamePageProps }) =>
{
	const { gameConsole, game, gameConsoles, games } = loaderData;

	return (
		<div className='EditAdminGamePage'>
			<RequirePermission permission='games-admin'>
				<Header
					name={`Game: ${game.name}`}
					link={`/admin/game-console/${encodeURIComponent(gameConsole.id)}`}
				/>

				<EditGame
					gameConsole={gameConsole}
					game={game}
					gameConsoles={gameConsoles}
					games={games}
				/>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditAdminGamePageProps>
{
	const [gameConsoles, game] = await Promise.all([
		this.query('v1/admin/game_consoles'),
		this.query('v1/admin/game/game', { id }),
	]);

	const [gameConsole, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', { id: game.gameConsoleId }),
		this.query('v1/admin/game_console/games', { id: game.gameConsoleId }),
	]);

	return { gameConsole, game, gameConsoles, games };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditAdminGamePageProps = {
	gameConsole: GameConsoleType
	game: GameType
	gameConsoles: GameConsoleType[]
	games: GameType[]
};

export default EditAdminGamePage;
