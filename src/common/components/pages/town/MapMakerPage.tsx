import { RequireClientJS, RequireUser } from '@behavior';
import MapMaker from '@/components/towns/MapMaker.tsx';
import { utils, constants, routerUtils } from '@utils';
import { ErrorMessage } from '@layout';
import { APIThisType, TownType } from '@types';

export const action = routerUtils.formAction;

const MapMakerPage = ({ loaderData }: { loaderData: MapMakerPageProps }) =>
{
	const { town } = loaderData;

	if (town.game.id === constants.gameIds.ACNH)
	{
		return <ErrorMessage identifier='bad-format' />;
	}

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='MapMakerPage'>
				<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
					<MapMaker
						town={town}
						mapTiles={utils.getMapTiles(town.game.id)}
					/>
				</RequireClientJS>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { townId }: { townId: string }): Promise<MapMakerPageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', { id: townId }),
	]);

	return { town };
}

export const loader = routerUtils.wrapLoader(loadData);

type MapMakerPageProps = {
	town: TownType
};

export default MapMakerPage;
