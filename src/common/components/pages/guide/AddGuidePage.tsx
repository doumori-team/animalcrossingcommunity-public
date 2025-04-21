import { RequirePermission } from '@behavior';
import EditGuide from '@/components/guide/EditGuide.tsx';
import { Header, Section } from '@layout';
import { APIThisType, ACGameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddGuidePage = ({ loaderData }: { loaderData: AddGuidePageProps }) =>
{
	const { game } = loaderData;

	return (
		<div className='AddGuidePage'>
			<RequirePermission permission='modify-guides'>
				<Header
					name='Guides'
					link={`/guides/${encodeURIComponent(game.id)}`}
				/>

				<Section>
					<EditGuide
						key={game.id}
						game={game}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { gameId }: { gameId: string }): Promise<AddGuidePageProps>
{
	const [game] = await Promise.all([
		this.query('v1/acgame', { id: gameId }),
	]);

	return { game };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddGuidePageProps = {
	game: ACGameType
};

export default AddGuidePage;
