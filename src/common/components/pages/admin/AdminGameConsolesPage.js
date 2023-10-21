import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Confirm } from '@form';
import { Header, Section, Grid } from '@layout';

const AdminGameConsolesPage = () =>
{
	const {gameConsoles} = useLoaderData();

	return (
		<div className='AdminGameConsolesPage'>
			<RequirePermission permission='games-admin'>
				<Header
					name='Game Consoles'
					links={
						<Link to={`/admin/game-console/add`}>
							Add New Console
						</Link>
					}
				/>

				<Section>
					<Grid name='game console' options={gameConsoles}>
						{gameConsoles.map(gameConsole => {
							const gameConsoleId = encodeURIComponent(gameConsole.id);

							return (
								<div key={gameConsole.id} className='AdminGameConsolesPage_gameConsole'>
									<div className='AdminGameConsolesPage_gameConsoleLinks'>
										<Link to={`/admin/game-console/${gameConsoleId}/edit`}>
											Edit
										</Link>

										<Confirm
											action='v1/admin/game_console/destroy'
											callback='/admin/game-consoles'
											label='Delete'
											message='Are you sure you want to delete this game console?'
											id={gameConsole.id}
										/>
									</div>
									<Link to={`/admin/game-console/${gameConsoleId}`}>
										{gameConsole.name}
									</Link>
								</div>
							);
						})}
					</Grid>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData()
{
	const [gameConsoles] = await Promise.all([
		this.query('v1/admin/game_consoles')
	]);

	return {gameConsoles};
}

export default AdminGameConsolesPage;
