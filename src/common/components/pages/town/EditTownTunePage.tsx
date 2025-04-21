import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Section } from '@layout';
import { APIThisType, TownType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditTownTunePage = ({ loaderData }: { loaderData: EditTownTunePageProps }) =>
{
	const { town } = loaderData;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownTunePage'>
				<Section>
					{!!town.tune &&
						<EditTune
							townId={town.id}
							tune={town.tune}
							userId={town.userId}
						/>
					}
				</Section>
			</div>
		</RequireUser>
	);
};

async function loadData(this: APIThisType, { townId }: { townId: string }): Promise<EditTownTunePageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', { id: townId }),
	]);

	return { town };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditTownTunePageProps = {
	town: TownType
};

export default EditTownTunePage;
