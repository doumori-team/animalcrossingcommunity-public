import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Header, Section } from '@layout';
import { APIThisType, TuneType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditTunePage = ({ loaderData }: { loaderData: EditTunePageProps }) =>
{
	const { tune } = loaderData;

	return (
		<div className='EditTunePage'>
			<RequireUser id={tune.creator.id} permission='modify-tunes'>
				<Header name='Town Tunes' link='/town-tunes' />

				<Section>
					<EditTune tune={tune} />
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditTunePageProps>
{
	const [tune] = await Promise.all([
		this.query('v1/tune', { id: id }),
	]);

	return { tune };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditTunePageProps = {
	tune: TuneType
};

export default EditTunePage;
