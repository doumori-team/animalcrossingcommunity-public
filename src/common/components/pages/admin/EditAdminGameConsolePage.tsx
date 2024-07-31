import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGameConsole from '@/components/admin/EditGameConsole.tsx';
import { APIThisType, GameConsoleType } from '@types';

const EditAdminGameConsolePage = () =>
{
	const {gameConsole, gameConsoles} = useLoaderData() as EditAdminGameConsolePageProps;

	return (
		<div className='EditAdminGameConsolePage'>
			<RequirePermission permission='games-admin'>
				<Header
					name={`Game Consoles: ${gameConsole.name}`}
					link='/admin/game-consoles'
				/>

				<EditGameConsole
					gameConsole={gameConsole}
					gameConsoles={gameConsoles}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<EditAdminGameConsolePageProps>
{
	const [gameConsole, gameConsoles] = await Promise.all([
		this.query('v1/admin/game_console/game_console', {id}),
		this.query('v1/admin/game_consoles')
	]);

	return {gameConsole, gameConsoles};
}

type EditAdminGameConsolePageProps = {
	gameConsole: GameConsoleType
	gameConsoles: GameConsoleType[]
}

export default EditAdminGameConsolePage;
