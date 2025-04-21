import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { Section } from '@layout';
import { APIThisType, TownType, ACGameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddTownFlagPage = ({ loaderData }: { loaderData: AddTownFlagPageProps }) =>
{
	const { town, acgames } = loaderData;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='AddTownFlagPage'>
				<Section>
					<EditPattern
						acgames={acgames}
						townId={town.id}
						userId={town.userId}
					/>
				</Section>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { townId }: { townId: string }): Promise<AddTownFlagPageProps>
{
	const town = await this.query('v1/town', { id: townId }) as TownType;
	const acgames = await Promise.all([
		this.query('v1/acgame', { id: town.game.id }),
	]);

	return { town, acgames };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddTownFlagPageProps = {
	town: TownType
	acgames: ACGameType[]
};

export default AddTownFlagPage;
