import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.js';
import { Header } from '@layout';

const AddAdminRuleViolationPage = () =>
{
	const {ruleId, severities} = useLoaderData();

	return (
		<div className='AddAdminRuleViolationPage'>
			<RequirePermission permission='modify-rules-admin'>
				<Header name='General Rules' />

				<EditViolation
					ruleId={ruleId}
					severities={severities}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData({ruleId})
{
	const [severities] = await Promise.all([
		this.query('v1/admin/rule/severities'),
	]);

	return {ruleId, severities};
}

export default AddAdminRuleViolationPage;
