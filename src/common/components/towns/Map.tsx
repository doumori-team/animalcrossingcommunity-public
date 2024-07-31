import React from 'react';

import { utils, constants } from '@utils';
import { TownType } from '@types';

const Map = ({
	game,
	mapTiles,
	selectedAcreId,
	onClickHandler
}: MapProps) =>
{
	const gameMapTiles = utils.getMapTiles(game.id);
	const mapDir = `${constants.AWS_URL}/images/maps/${game.identifier}/`;
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
				onClick={onClickHandler != null ? () => onClickHandler(key, gameMapTile) : () => {}}
				alt='Map Tile'
			/>;

			cells.push(img);
		}

		rows.push(<div key={y} className='row'>{cells}</div>);
	}

	return <div className='Map'>{rows}</div>;
}

type MapProps = {
	game: TownType['game']
	mapTiles: number[]
	selectedAcreId?: number
	onClickHandler?: Function
};

export default Map;
