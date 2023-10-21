import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.js';
import { Section } from '@layout';

const EditTownFlagPage = () =>
{
	const {town, acgames} = useLoaderData();

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownFlagPage'>
				<Section>
					<EditPattern
						pattern={town.flag}
						acgames={acgames}
						townId={town.id}
						userId={town.userId}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData({townId})
{
	const [town, acgames] = await Promise.all([
		this.query('v1/town', {id: townId}),
		this.query('v1/acgames'),
	]);

	return {town, acgames};
}

export default EditTownFlagPage;
