import { getSeason } from 'common/calendar.ts';
import { RequirePermission } from '@behavior';
import Town from '@/components/towns/Town.tsx';
import { Section } from '@layout';
import { APIThisType, SeasonsType, TownType } from '@types';
import { constants, routerUtils } from '@utils';

export const action = routerUtils.formAction;

const UserTownPage = ({ loaderData }: { loaderData: UserTownPageProps }) =>
{
	const { town, season } = loaderData;

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

async function loadData(this: APIThisType, { townId }: { townId: number }, { debug }: { debug?: string }): Promise<UserTownPageProps>
{
	const town = await this.query('v1/town', { id: townId });
	const season = getSeason(constants.LIVE_SITE ? null : debug);
	return { town, season };
}

export const loader = routerUtils.wrapLoader(loadData);

type UserTownPageProps = {
	town: TownType
	season: SeasonsType
};

export default UserTownPage;
