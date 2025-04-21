import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { Header, Section } from '@layout';
import { APIThisType, ACGameType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const AddPatternPage = ({ loaderData }: { loaderData: AddPatternPageProps }) =>
{
	const { acgames } = loaderData;

	return (
		<div className='AddPatternPage'>
			<RequireUser permission='modify-patterns'>
				<Header
					name='Patterns'
					link='/patterns'
				/>

				<Section>
					<EditPattern
						acgames={acgames}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType): Promise<AddPatternPageProps>
{
	const [acgames] = await Promise.all([
		this.query('v1/acgames'),
	]);

	return { acgames };
}

export const loader = routerUtils.wrapLoader(loadData);

type AddPatternPageProps = {
	acgames: ACGameType[]
};

export default AddPatternPage;
