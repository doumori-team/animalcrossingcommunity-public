import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireClientJS, RequireUser } from '@behavior';
import MapMaker from '@/components/towns/MapMaker.js';
import MapDesigner from '@/components/towns/MapDesigner.js';
import { utils, constants } from '@utils';
import { ErrorMessage, RequireLargeScreen } from '@layout';

const MapMakerPage = () =>
{
	const {town} = useLoaderData();

	const mapInfo = utils.getMapInfo(town.game.id);

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='MapMakerPage'>
				<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
					{town.game.id === constants.gameIds.ACNH ? (
						<RequireLargeScreen size='1275'>
							<MapDesigner
								townId={town.id}
								images={utils.getMapImages(town.game.id)}
								colors={utils.getMapColors(town.game.id)}
								data={town.mapDesignData.colorData}
								dataUrl={town.mapDesignData.dataUrl}
								gridLength={mapInfo.gridLength}
								width={mapInfo.gridLength*mapInfo.width}
								height={mapInfo.gridLength*mapInfo.height}
								cursorData={town.mapDesignData.cursorData}
								flipData={town.mapDesignData.flipData}
								imageData={town.mapDesignData.imageData}
							/>
						</RequireLargeScreen>
					) : (
						<MapMaker
							town={town}
							mapTiles={utils.getMapTiles(town.game.id)}
						/>
					)}
				</RequireClientJS>
			</div>
		</RequireUser>
	);
}

export async function loadData({townId})
{
	const [town] = await Promise.all([
		this.query('v1/town', {id: townId}),
	]);

	return {town};
}

export default MapMakerPage;
