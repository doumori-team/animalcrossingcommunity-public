import { Link } from 'react-router';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { Header, Section } from '@layout';
import { APIThisType, ACGameType, PatternType } from '@types';
import { routerUtils } from '@utils';

export const action = routerUtils.formAction;

const EditPatternPage = ({ loaderData }: { loaderData: EditPatternPageProps }) =>
{
	const { pattern, acgames } = loaderData;

	return (
		<div className='EditPatternPage'>
			<RequireUser id={pattern.creator.id} permission='modify-patterns'>
				<Header
					name='Patterns'
					link='/patterns'
					links={
						<Link to={`/patterns/add`}>
							Create a Pattern
						</Link>
					}
				/>

				<Section>
					<EditPattern
						pattern={pattern}
						acgames={acgames}
					/>
				</Section>
			</RequireUser>
		</div>
	);
};

async function loadData(this: APIThisType, { id }: { id: string }): Promise<EditPatternPageProps>
{
	const pattern = await this.query('v1/pattern', { id }) as PatternType;
	const acgames = await Promise.all([
		this.query('v1/acgame', { id: pattern.gameId }),
	]);

	return { acgames, pattern };
}

export const loader = routerUtils.wrapLoader(loadData);

type EditPatternPageProps = {
	acgames: ACGameType[]
	pattern: PatternType
};

export default EditPatternPage;
