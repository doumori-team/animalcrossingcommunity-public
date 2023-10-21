import React from 'react';
import PropTypes from 'prop-types';

import { utils } from '@utils';

const Map = ({game, mapTiles, selectedAcreId, onClickHandler}) =>
{
	const gameMapTiles = utils.getMapTiles(game.id);
	const mapDir = `${process.env.AWS_URL}/images/maps/${game.identifier}/`;
	const rows = [];

	for (let y = 0; y < game.mapY; y++)
	{
		const cells = [];

		for (let x = 0; x < game.mapX; x++)
		{
			const key = y * game.mapX + x;
			const mapTileId = mapTiles[key];
			const gameMapTile = gameMapTiles.all[mapTileId];

			if (!gameMapTile)
			{
				continue;
			}

			const img = <img
				key={key}
				src={mapDir + gameMapTile.img_name}
				className={selectedAcreId === key ? 'selected': ''}
				onClick={() => onClickHandler(key, gameMapTile)}
				alt='Map Tile'
			/>;

			cells.push(img);
		}

		rows.push(<div key={y} className='row'>{cells}</div>);
	}

	return <div className='Map'>{rows}</div>;
}

Map.propTypes = {
	game: PropTypes.shape({
		id: PropTypes.number.isRequired,
		mapX: PropTypes.number.isRequired,
		mapY: PropTypes.number.isRequired,
		identifier: PropTypes.string.isRequired,
	}).isRequired,
	mapTiles: PropTypes.arrayOf(PropTypes.number).isRequired,
	selectedAcreId: PropTypes.number,
	onClickHandler: PropTypes.func,
}

export default Map;
