import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { getSeason } from 'common/calendar.ts';
import { RequirePermission } from '@behavior';
import Town from '@/components/towns/Town.js';
import { Section } from '@layout';
import { APIThisType, SeasonsType, TownType } from '@types';
import { constants } from '@utils';

const UserTownPage = () =>
{
	const { town, season } = useLoaderData() as UserTownPageProps;

	return (
		<RequirePermission permission='view-towns'>
			<div className='UserTownsPage'>
				<Section>
					<Town town={town} season={season} />
				</Section>
			</div>
		</RequirePermission>
	);
};

export async function loadData(this: APIThisType, { townId }: { townId: number }, { debug }: { debug?: string }): Promise<UserTownPageProps>
{
	const town = await this.query('v1/town', { id: townId });
	const season = getSeason(constants.LIVE_SITE ? null : debug);
	return { town, season };
}

type UserTownPageProps = {
	town: TownType
	season: SeasonsType
};

export default UserTownPage;
