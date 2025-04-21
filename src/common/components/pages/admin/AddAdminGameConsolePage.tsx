import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import EditGameConsole from '@/components/admin/EditGameConsole.tsx';
import { APIThisType, GameConsoleType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddAdminGameConsolePage = ({ loaderData }: { loaderData: AddAdminGameConsolePageProps }) =>
{
	const { gameConsoles } = loaderData;

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

async function loadData(this: APIThisType): Promise<AddAdminGameConsolePageProps>
{
	const [gameConsoles] = await Promise.all([
		this.query('v1/admin/game_consoles'),
	]);

	return { gameConsoles };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddAdminGameConsolePageProps = {
	gameConsoles: GameConsoleType[]
};

export default AddAdminGameConsolePage;
