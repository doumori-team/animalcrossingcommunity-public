import React from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

import { acgameShape } from '@propTypes';
import Grid from '@/components/layout/Grid.js';

const ACGameButtons = ({acgames, link, reloadDocument}) =>
{
	const location = useLocation();
	const paths = location.pathname.split('/');

	return (
		<Grid options={acgames}>
			{acgames.map(acGame =>
				<Link to={`${link}/${encodeURIComponent(acGame.id)}`}
					key={acGame.id}
					className={`ACGameButtons_game ACGameButtons_game_${acGame.identifier} ${!paths.find(p => p == acGame.id) && `ACGameButtons_game_notSelected`}`}
					aria-label={acGame.name}
					preventScrollReset={true}
					reloadDocument={reloadDocument}
				>
					<p>{acGame.name}</p>
				</Link>
			)}
		</Grid>
	);
}

ACGameButtons.propTypes = {
	acgames: PropTypes.arrayOf(acgameShape).isRequired,
	link: PropTypes.string.isRequired,
	reloadDocument: PropTypes.bool,
};

ACGameButtons.defaultPropTypes = {
	reloadDocument: false,
}

export default ACGameButtons;
