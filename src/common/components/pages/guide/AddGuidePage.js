import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import EditGuide from '@/components/guide/EditGuide.js';
import { Header, Section } from '@layout';

const AddGuidePage = () =>
{
	const {game, emojiSettings} = useLoaderData();

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
						emojiSettings={emojiSettings}
					/>
				</Section>
			</RequirePermission>
		</div>
	);
}

export async function loadData({gameId})
{
	const [game, emojiSettings] = await Promise.all([
		this.query('v1/acgame', {id: gameId}),
		this.query('v1/settings/emoji'),
	]);

	return {game, emojiSettings};
}

export default AddGuidePage;
