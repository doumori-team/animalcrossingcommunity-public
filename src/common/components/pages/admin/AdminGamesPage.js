import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Confirm } from '@form';
import { Header, Section, Grid } from '@layout';

const AdminGamesPage = () =>
{
	const {gameConsole, games} = useLoaderData();

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
									/>
								</div>
								{game.name}
							</div>
						)}
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData({id})
{
	const [gameConsole, games] = await Promise.all([
		this.query('v1/admin/game_console/game_console', {id}),
		this.query('v1/admin/game_console/games', {id})
	]);

	return {gameConsole, games};
}

export default AdminGamesPage;
