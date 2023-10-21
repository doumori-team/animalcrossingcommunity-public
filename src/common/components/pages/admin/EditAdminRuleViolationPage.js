import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.js';
import { Header } from '@layout';

const EditAdminRuleViolationPage = () =>
{
	const {ruleId, violation, severities} = useLoaderData();

	return (
		<div className='EditAdminRuleViolationPage'>
			<RequirePermission permission='modify-rules-admin'>
				<Header name='General Rules' />

				<EditViolation
					ruleId={ruleId}
					violation={violation}
					severities={severities}
				/>
			</RequirePermission>
		</div>
	);
}

export async function loadData({ruleId, violationId})
{
	const [violation, severities] = await Promise.all([
		this.query('v1/admin/violation', {id: violationId}),
		this.query('v1/admin/rule/severities'),
	]);

	return {ruleId, violation, severities};
}

export default EditAdminRuleViolationPage;
