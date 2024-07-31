import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditFeature from '@/components/features/EditFeature.tsx';
import { Header, Section } from '@layout';
import { APIThisType, FeatureCategoryType, FeatureStatusType, EmojiSettingType } from '@types';

const AddFeaturePage = () =>
{
	const {categories, statuses, userEmojiSettings} = useLoaderData() as AddFeaturePageProps;

	return (
		<RequireUser permission='suggest-features'>
			<div className='AddFeaturePage'>
				<Header
					name='Suggest a Feature or Report a Bug'
					link='/features'
				/>

				<Section>
					<EditFeature
						categories={categories}
						statuses={statuses}
						userEmojiSettings={userEmojiSettings}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType) : Promise<AddFeaturePageProps>
{
	const [categories, statuses, userEmojiSettings] = await Promise.all([
		this.query('v1/feature/categories'),
		this.query('v1/feature/statuses'),
		this.query('v1/settings/emoji'),
	]);

	return {categories, statuses, userEmojiSettings};
}

type AddFeaturePageProps = {
	categories: FeatureCategoryType[]
	statuses: FeatureStatusType[]
	userEmojiSettings: EmojiSettingType[]
}

export default AddFeaturePage;