import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ACGameType, LocationType } from '@types';
import Grid from '@/components/layout/Grid.tsx';

const ACGameButtons = ({
	acgames,
	link,
	reloadDocument = false,
}: ACGameButtonsProps) =>
{
	const location = useLocation() as LocationType;
	const paths = location.pathname.split('/');

	return (
		<Grid options={acgames}>
			{acgames.map(acGame =>
				<Link to={`${link}/${encodeURIComponent(acGame.id)}`}
					key={acGame.id}
					className={`ACGameButtons_game ACGameButtons_game_${acGame.identifier} ${!paths.find(p => Number(p) === acGame.id) && `ACGameButtons_game_notSelected`}`}
					aria-label={acGame.name}
					preventScrollReset={true}
					reloadDocument={reloadDocument}
				>
					<p>{acGame.name}</p>
				</Link>,
			)}
		</Grid>
	);
};

type ACGameButtonsProps = {
	acgames: ACGameType[]
	link: string
	reloadDocument?: boolean
};

export default ACGameButtons;
