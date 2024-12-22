import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { Header, Section } from '@layout';
import { APIThisType, ACGameType } from '@types';

const AddPatternPage = () =>
{
	const { acgames } = useLoaderData() as AddPatternPageProps;

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

export async function loadData(this: APIThisType): Promise<AddPatternPageProps>
{
	const [acgames] = await Promise.all([
		this.query('v1/acgames'),
	]);

	return { acgames };
}

type AddPatternPageProps = {
	acgames: ACGameType[]
};

export default AddPatternPage;
