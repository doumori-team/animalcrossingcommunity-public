import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGame from '@/components/admin/EditGame.tsx';
import { APIThisType, GameConsoleType, GameType } from '@types';

const AddAdminGamePage = () =>
{
	const { gameConsole, gameConsoles, games } = useLoaderData() as AddAdminGamePageProps;

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

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<AddAdminGamePageProps>
{
	const [gameConsole, gameConsoles, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', { id }),
		this.query('v1/admin/game_consoles'),
		this.query('v1/admin/game_console/games', { id }),
	]);

	return { gameConsole, gameConsoles, games };
}

type AddAdminGamePageProps = {
	gameConsole: GameConsoleType
	gameConsoles: GameConsoleType[]
	games: GameType[]
};

export default AddAdminGamePage;
