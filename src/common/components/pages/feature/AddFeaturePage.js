import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditFeature from '@/components/features/EditFeature.js';
import { Header, Section } from '@layout';

const AddFeaturePage = () =>
{
	const {categories, statuses, userEmojiSettings} = useLoaderData();

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

export async function loadData()
{
	const [categories, statuses, userEmojiSettings] = await Promise.all([
		this.query('v1/feature/categories'),
		this.query('v1/feature/statuses'),
		this.query('v1/settings/emoji'),
	]);

	return {categories, statuses, userEmojiSettings};
}

export default AddFeaturePage;