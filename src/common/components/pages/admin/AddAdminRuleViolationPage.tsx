import { RequirePermission } from '@behavior';
import EditViolation from '@/components/admin/EditViolation.tsx';
import { Header } from '@layout';
import { APIThisType, SeverityType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddAdminRuleViolationPage = ({ loaderData }: { loaderData: AddAdminRuleViolationPageProps }) =>
{
	const { ruleId, severities } = loaderData;

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

async function loadData(this: APIThisType, { ruleId }: { ruleId: string }): Promise<AddAdminRuleViolationPageProps>
{
	const [severities] = await Promise.all([
		this.query('v1/admin/rule/severities'),
	]);

	return { ruleId, severities };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddAdminRuleViolationPageProps = {
	ruleId: string
	severities: SeverityType[]
};

export default AddAdminRuleViolationPage;
