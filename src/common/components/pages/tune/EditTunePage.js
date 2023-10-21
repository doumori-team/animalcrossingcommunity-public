import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.js';
import { Header, Section } from '@layout';

const EditTunePage = () =>
{
	const {tune} = useLoaderData();

	return (
		<div className='EditTunePage'>
			<RequireUser id={tune.creator.id} permission='modify-tunes'>
				<Header name='Town Tunes' link='/town-tunes' />

				<Section>
					<EditTune tune={tune} />
				</Section>
			</RequireUser>
		</div>
	);
}

export async function loadData({id})
{
	const [tune] = await Promise.all([
		this.query('v1/tune', {id: id}),
	]);

	return {tune};
}

export default EditTunePage;
