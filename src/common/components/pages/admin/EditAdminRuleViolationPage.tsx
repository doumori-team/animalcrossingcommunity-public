import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.tsx';
import { Header } from '@layout';
import { APIThisType, ViolationType, SeverityType } from '@types';

const EditAdminRuleViolationPage = () =>
{
	const { ruleId, violation, severities } = useLoaderData() as EditAdminRuleViolationPageProps;

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
};

export async function loadData(this: APIThisType, { ruleId, violationId }: { ruleId: string, violationId: string }): Promise<EditAdminRuleViolationPageProps>
{
	const [violation, severities] = await Promise.all([
		this.query('v1/admin/violation', { id: violationId }),
		this.query('v1/admin/rule/severities'),
	]);

	return { ruleId, violation, severities };
}

type EditAdminRuleViolationPageProps = {
	ruleId: string
	violation: ViolationType
	severities: SeverityType[]
};

export default EditAdminRuleViolationPage;
