import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGame from '@/components/admin/EditGame.js';

const EditAdminGamePage = () =>
{
	const {gameConsole, game, gameConsoles, games} = useLoaderData();

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
}

export async function loadData({id})
{
	const [gameConsoles, game] = await Promise.all([
		this.query('v1/admin/game_consoles'),
		this.query('v1/admin/game/game', {id})
	]);

	const [gameConsole, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', {id: game.gameConsoleId}),
		this.query('v1/admin/game_console/games', {id: game.gameConsoleId})
	]);

	return {gameConsole, game, gameConsoles, games};
}

export default EditAdminGamePage;
