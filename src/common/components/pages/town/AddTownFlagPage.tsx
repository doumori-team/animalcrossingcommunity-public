import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireUser } from '@behavior';
import EditPattern from '@/components/pattern/EditPattern.tsx';
import { Section } from '@layout';
import { APIThisType, TownType, ACGameType } from '@types';

const AddTownFlagPage = () =>
{
	const { town, acgames } = useLoaderData() as AddTownFlagPageProps;

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='AddTownFlagPage'>
				<Section>
					<EditPattern
						acgames={acgames}
						townId={town.id}
						userId={town.userId}
					/>
				</Section>
			</div>
		</RequireUser>
	);
};

export async function loadData(this: APIThisType, { townId }: { townId: string }): Promise<AddTownFlagPageProps>
{
	const town = await this.query('v1/town', { id: townId }) as TownType;
	const acgames = await Promise.all([
		this.query('v1/acgame', { id: town.game.id }),
	]);

	return { town, acgames };
}

type AddTownFlagPageProps = {
	town: TownType
	acgames: ACGameType[]
};

export default AddTownFlagPage;
