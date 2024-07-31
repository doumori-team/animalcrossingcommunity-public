import React from 'react';
import { useLoaderData } from 'react-router-dom';

import EditRule from '@/components/admin/EditRule.tsx';
import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import { APIThisType, RuleCategoryType } from '@types';

const AddAdminRulePage = () =>
{
	const {categories} = useLoaderData() as AddAdminRulePageProps;

	return (
		<div className='AddAdminRulePage'>
			<RequirePermission permission='modify-rules-admin'>
				<Header name='General Rules' />

				<EditRule
					categories={categories}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData(this: APIThisType) : Promise<AddAdminRulePageProps>
{
	const [categories] = await Promise.all([
		this.query('v1/rule/categories'),
	]);

	return {categories};
}

type AddAdminRulePageProps = {
	categories: RuleCategoryType[]
}

export default AddAdminRulePage;
