import React from 'react';
import { useLoaderData } from 'react-router-dom';

import { RequireClientJS, RequireUser } from '@behavior';
import MapMaker from '@/components/towns/MapMaker.tsx';
import MapDesigner from '@/components/towns/MapDesigner.tsx';
import { utils, constants } from '@utils';
import { ErrorMessage, RequireLargeScreen } from '@layout';
import { APIThisType, TownType } from '@types';

const MapMakerPage = () =>
{
	const {town} = useLoaderData() as MapMakerPageProps;

	const mapInfo = utils.getMapInfo(town.game.id);

	return (
		<RequireUser id={town.userId} permission='modify-towns'>
			<div className='MapMakerPage'>
				<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
					{town.game.id === constants.gameIds.ACNH ? (
						<RequireLargeScreen size='1275'>
							{town.mapDesignData != null && (
								<MapDesigner
									townId={town.id}
									images={utils.getMapImages(town.game.id)}
									initialColors={utils.getMapColors(town.game.id)}
									data={town.mapDesignData.colorData}
									initialDataUrl={town.mapDesignData.dataUrl}
									gridLength={mapInfo.gridLength}
									width={mapInfo.gridLength*mapInfo.width}
									height={mapInfo.gridLength*mapInfo.height}
									cursorData={town.mapDesignData.cursorData}
									flipData={town.mapDesignData.flipData}
									imageData={town.mapDesignData.imageData}
								/>
							)}
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

export async function loadData(this: APIThisType, {townId}: {townId: string}) : Promise<MapMakerPageProps>
{
	const [town] = await Promise.all([
		this.query('v1/town', {id: townId}),
	]);

	return {town};
}

type MapMakerPageProps = {
	town: TownType
}

export default MapMakerPage;
