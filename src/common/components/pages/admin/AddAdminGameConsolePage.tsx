import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGameConsole from '@/components/admin/EditGameConsole.tsx';
import { APIThisType, GameConsoleType } from '@types';

const AddAdminGameConsolePage = () =>
{
	const { gameConsoles } = useLoaderData() as AddAdminGameConsolePageProps;

	return (
		<div className='AddAdminGameConsolePage'>
			<RequirePermission permission='games-admin'>
				<Header
					name='Game Consoles'
					link='/admin/game-consoles'
				/>

				<EditGameConsole
					gameConsoles={gameConsoles}
				/>
			</RequirePermission>
		</div>
	);
};

export async function loadData(this: APIThisType): Promise<AddAdminGameConsolePageProps>
{
	const [gameConsoles] = await Promise.all([
		this.query('v1/admin/game_consoles'),
	]);

	return { gameConsoles };
}

type AddAdminGameConsolePageProps = {
	gameConsoles: GameConsoleType[]
};

export default AddAdminGameConsolePage;
