import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.tsx';
import { Header } from '@layout';
import { APIThisType, ViolationType, SeverityType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditAdminRuleViolationPage = ({ loaderData }: { loaderData: EditAdminRuleViolationPageProps }) =>
{
	const { ruleId, violation, severities } = loaderData;

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

async function loadData(this: APIThisType, { ruleId, violationId }: { ruleId: string, violationId: string }): Promise<EditAdminRuleViolationPageProps>
{
	const [violation, severities] = await Promise.all([
		this.query('v1/admin/violation', { id: violationId }),
		this.query('v1/admin/rule/severities'),
	]);

	return { ruleId, violation, severities };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditAdminRuleViolationPageProps = {
	ruleId: string
	violation: ViolationType
	severities: SeverityType[]
};

export default EditAdminRuleViolationPage;
