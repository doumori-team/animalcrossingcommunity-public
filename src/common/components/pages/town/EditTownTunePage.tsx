import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditTune from '@/components/tunes/EditTune.tsx';
import { Section } from '@layout';
import { APIThisType, TownType } from '@types';

const EditTownTunePage = () =>
{
	const {town} = useLoaderData() as EditTownTunePageProps;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='EditTownTunePage'>
				<Section>
					{town.tune != null && (
						<EditTune
							townId={town.id}
							tune={town.tune}
							userId={town.userId}
						/>
					)}
				</Section>
			</div>
		</RequireUser>
	);
}

export async function loadData(this: APIThisType, {townId}: {townId: string}) : Promise<EditTownTunePageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', {id: townId}),
	]);

	return {town};
}

type EditTownTunePageProps = {
	town: TownType
}

export default EditTownTunePage;
