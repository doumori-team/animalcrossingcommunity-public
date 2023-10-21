import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.js';
import { Header, Section } from '@layout';

const EditPatternPage = () =>
{
	const {pattern, acgames} = useLoaderData();

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
}

export async function loadData({id})
{
	const [acgames, pattern] = await Promise.all([
		this.query('v1/acgames'),
		this.query('v1/pattern', {id: id}),
	]);

	return {acgames, pattern};
}

export default EditPatternPage;
