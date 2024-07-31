import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Header, Section } from '@layout';
import { APIThisType, TuneType } from '@types';

const EditTunePage = () =>
{
	const {tune} = useLoaderData() as EditTunePageProps;

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

export async function loadData(this: APIThisType, {id}: {id: string}) : Promise<EditTunePageProps>
{
	const [tune] = await Promise.all([
		this.query('v1/tune', {id: id}),
	]);

	return {tune};
}

type EditTunePageProps = {
	tune: TuneType
}

export default EditTunePage;
