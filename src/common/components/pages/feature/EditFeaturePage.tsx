import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditFeature from '@/components/features/EditFeature.tsx';
import { Header, Section } from '@layout';
import { APIThisType, FeatureType, FeatureCategoryType, FeatureStatusType, EmojiSettingType } from '@types';

const EditFeaturePage = () =>
{
	const { feature, categories, statuses, userEmojiSettings } = useLoaderData() as EditFeaturePageProps;

	return (
		<RequirePermission permission='claim-features'>
			<div className='EditFeaturePage'>
				<Header
					name='Features'
					link='/features'
					links={
						<Link to={`/features/add`}>
							Suggest Feature / Report Bug
						</Link>
					}
				/>

				<Section>
					<EditFeature
						categories={categories}
						statuses={statuses}
						feature={feature}
						userEmojiSettings={userEmojiSettings}
					/>
				</Section>
			</div>
		</RequirePermission>
	);
};

export async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditFeaturePageProps>
{
	const [feature, categories, statuses] = await Promise.all([
		this.query('v1/feature', { id: id }),
		this.query('v1/feature/categories'),
		this.query('v1/feature/statuses'),
	]);

	const [userEmojiSettings] = await Promise.all([
		this.query('v1/settings/emoji', { userIds: [feature.user.id] }),
	]);

	return { feature, categories, statuses, userEmojiSettings };
}

type EditFeaturePageProps = {
	feature: FeatureType
	categories: FeatureCategoryType[]
	statuses: FeatureStatusType[]
	userEmojiSettings: EmojiSettingType[]
};

export default EditFeaturePage;
