import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditRule from '@/components/admin/EditRule.js';
import { Header } from '@layout';

const EditAdminRulePage = () =>
{
	const {rule, categories} = useLoaderData();

	return (
		<div className='EditAdminRulePage'>
			<Header name='General Rules' />

			<RequirePermission permission='modify-rules-admin'>
				<EditRule
					rule={rule}
					categories={categories}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData({ruleId})
{
	const [rule, categories] = await Promise.all([
		this.query('v1/admin/rule', {id: ruleId}),
		this.query('v1/rule/categories'),
	]);

	return {rule, categories};
}

export default EditAdminRulePage;
