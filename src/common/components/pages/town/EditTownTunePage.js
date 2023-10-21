import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.js';
import { Section } from '@layout';

const EditTownTunePage = () =>
{
	const {town} = useLoaderData();

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownTunePage'>
				<Section>
					<EditTune
						townId={town.id}
						tune={town.tune}
						userId={town.userId}
					/>
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData({townId})
{
	const [town] = await Promise.all([
		this.query('v1/town', {id: townId}),
	]);

	return {town};
}

export default EditTownTunePage;
