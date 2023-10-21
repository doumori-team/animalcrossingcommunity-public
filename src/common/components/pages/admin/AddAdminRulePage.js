import React from 'react';
import { useLoaderData } from 'react-router-dom';

import EditRule from '@/components/admin/EditRule.js';
import { RequirePermission } from '@behavior';
import { Header } from '@layout';

const AddAdminRulePage = () =>
{
	const {categories} = useLoaderData();

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

export async function loadData()
{
	const [categories] = await Promise.all([
		this.query('v1/rule/categories'),
	]);

	return {categories};
}

export default AddAdminRulePage;
