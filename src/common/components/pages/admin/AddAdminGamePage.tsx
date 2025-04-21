import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGame from '@/components/admin/EditGame.tsx';
import { APIThisType, GameConsoleType, GameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddAdminGamePage = ({ loaderData }: { loaderData: AddAdminGamePageProps }) =>
{
	const { gameConsole, gameConsoles, games } = loaderData;

	return (
		<div className='AddAdminGamePage'>
			<RequirePermission permission='games-admin'>
				<Header
					name='Games'
					link={`/admin/game-console/${encodeURIComponent(gameConsole.id)}`}
				/>

				<EditGame
					gameConsole={gameConsole}
					gameConsoles={gameConsoles}
					games={games}
				/>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<AddAdminGamePageProps>
{
	const [gameConsole, gameConsoles, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', { id }),
		this.query('v1/admin/game_consoles'),
		this.query('v1/admin/game_console/games', { id }),
	]);

	return { gameConsole, gameConsoles, games };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddAdminGamePageProps = {
	gameConsole: GameConsoleType
	gameConsoles: GameConsoleType[]
	games: GameType[]
};

export default AddAdminGamePage;
