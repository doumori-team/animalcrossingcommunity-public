import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditGuide from '@/components/guide/EditGuide.tsx';
import { Header, Section } from '@layout';
import { APIThisType, GuideType } from '@types';

const EditGuidePage = () =>
{
	const { guide } = useLoaderData() as EditGuidePageProps;

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

export async function loadData(this: APIThisType, { id }: { id: string })
{
	const [guide] = await Promise.all([
		this.query('v1/guide', { id: id }),
	]);

	return { guide };
}

type EditGuidePageProps = {
	guide: GuideType
};

export default EditGuidePage;
