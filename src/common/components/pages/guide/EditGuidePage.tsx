import { RequirePermission } from '@behavior';
import EditGuide from '@/components/guide/EditGuide.tsx';
import { Header, Section } from '@layout';
import { APIThisType, GuideType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditGuidePage = ({ loaderData }: { loaderData: EditGuidePageProps }) =>
{
	const { guide } = loaderData;

	return (
		<div className='EditGuidePage'>
			<RequirePermission permission='modify-guides'>
				<Header
					name='Guides'
					link={`/guides/${encodeURIComponent(guide.game.id)}`}
				/>

				<Section>
					<EditGuide
						key={guide.id}
						game={guide.game}
						guide={guide}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string })
{
	const [guide] = await Promise.all([
		this.query('v1/guide', { id: id }),
	]);

	return { guide };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditGuidePageProps = {
	guide: GuideType
};

export default EditGuidePage;
