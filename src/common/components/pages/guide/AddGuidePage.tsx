import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditGuide from '@/components/guide/EditGuide.tsx';
import { Header, Section } from '@layout';
import { APIThisType, ACGameType } from '@types';

const AddGuidePage = () =>
{
	const {game} = useLoaderData() as AddGuidePageProps;

	return (
		<div className='AddGuidePage'>
			<RequirePermission permission='modify-guides'>
				<Header
					name='Guides'
					link={`/guides/${encodeURIComponent(game.id)}`}
				/>

				<Section>
					<EditGuide
						key={game.id}
						game={game}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData(this: APIThisType, {gameId}: {gameId: string}) : Promise<AddGuidePageProps>
{
	const [game] = await Promise.all([
		this.query('v1/acgame', {id: gameId}),
	]);

	return {game};
}

type AddGuidePageProps = {
	game: ACGameType
}

export default AddGuidePage;
