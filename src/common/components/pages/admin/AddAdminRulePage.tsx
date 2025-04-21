import EditRule from '@/components/admin/EditRule.tsx';
import { RequirePermission } from '@behavior';
import { Header } from '@layout';
import { APIThisType, RuleCategoryType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddAdminRulePage = ({ loaderData }: { loaderData: AddAdminRulePageProps }) =>
{
	const { categories } = loaderData;

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
};

async function loadData(this: APIThisType): Promise<AddAdminRulePageProps>
{
	const [categories] = await Promise.all([
		this.query('v1/rule/categories'),
	]);

	return { categories };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddAdminRulePageProps = {
	categories: RuleCategoryType[]
};

export default AddAdminRulePage;
