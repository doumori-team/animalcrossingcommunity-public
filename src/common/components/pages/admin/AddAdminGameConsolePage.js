import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGameConsole from '@/components/admin/EditGameConsole.js';

const AddAdminGameConsolePage = () =>
{
	const {gameConsoles} = useLoaderData();

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
}

export async function loadData()
{
	const [gameConsoles] = await Promise.all([
		this.query('v1/admin/game_consoles')
	]);

	return {gameConsoles};
}

export default AddAdminGameConsolePage;
