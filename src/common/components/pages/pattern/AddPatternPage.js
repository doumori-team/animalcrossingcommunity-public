import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.js';
import { Header, Section } from '@layout';

const AddPatternPage = () =>
{
	const {acgames} = useLoaderData();

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
}

export async function loadData()
{
	const [acgames] = await Promise.all([
		this.query('v1/acgames'),
	]);

	return {acgames};
}

export default AddPatternPage;
