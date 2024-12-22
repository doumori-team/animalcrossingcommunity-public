import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.tsx';
import { Header } from '@layout';
import { APIThisType, SeverityType } from '@types';

const AddAdminRuleViolationPage = () =>
{
	const { ruleId, severities } = useLoaderData() as AddAdminRuleViolationPageProps;

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
};

export async function loadData(this: APIThisType, { ruleId }: { ruleId: string }): Promise<AddAdminRuleViolationPageProps>
{
	const [severities] = await Promise.all([
		this.query('v1/admin/rule/severities'),
	]);

	return { ruleId, severities };
}

type AddAdminRuleViolationPageProps = {
	ruleId: string
	severities: SeverityType[]
};

export default AddAdminRuleViolationPage;
