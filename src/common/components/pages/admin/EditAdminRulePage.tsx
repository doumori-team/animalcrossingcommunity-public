import { RequirePermission } from '@behavior';
import EditRule from '@/components/admin/EditRule.tsx';
import { Header } from '@layout';
import { APIThisType, RuleCategoryType, RuleType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditAdminRulePage = ({ loaderData }: { loaderData: EditAdminRulePageProps }) =>
{
	const { rule, categories } = loaderData;

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
};

async function loadData(this: APIThisType, { ruleId }: { ruleId: string }): Promise<EditAdminRulePageProps>
{
	const [rule, categories] = await Promise.all([
		this.query('v1/admin/rule', { id: ruleId }),
		this.query('v1/rule/categories'),
	]);

	return { rule, categories };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditAdminRulePageProps = {
	rule: RuleType
	categories: RuleCategoryType[]
};

export default EditAdminRulePage;
