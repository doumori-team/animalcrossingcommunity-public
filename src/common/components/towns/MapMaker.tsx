import React, { useState } from 'react';

import { Form } from '@form';
import { TownType, MapTilesType } from '@types';
import Map from '@/components/towns/Map.tsx';
import { constants } from '@utils';

const MapMaker = ({
	town,
	mapTiles,
}: MapMakerProps) =>
{
	const firstTile = mapTiles.all[town.mapTiles[0]];

	const [acres, setAcres] = useState<TownType['mapTiles']>(town.mapTiles);
	const [selectedAcreId, setSelectedAcreId] = useState<number>(0);
	const [currentAcre, setCurrentAcre] = useState<string>('A');
	const [selectedPaletteParentId, setSelectedPaletteParentId] = useState<MapTilesType['all'][number]['parent_id']>(firstTile.parent_id);
	const [selectedPaletteChildId1, setSelectedPaletteChildId1] = useState<MapTilesType['all'][number]['child_id1']>(firstTile.child_id1);
	const [selectedPaletteChildId2, setSelectedPaletteChildId2] = useState<MapTilesType['all'][number]['child_id2']>(firstTile.child_id2);
	const [selectedStyleId, setSelectedStyleId] = useState<number>(firstTile.id);

	const mapDir = `${constants.AWS_URL}/images/maps/${town.game.identifier}/`;

	const handleAcreChange = (selectedAcreId: number, styleMapTile: MapMakerProps['mapTiles']['all'][number]): void =>
	{
		let newSelectedAcreId = Number(selectedAcreId);
		let newCurrentAcre = 'A';

		// if you can't change acre, like in AC:GC A3, don't select it
		if (styleMapTile.unchangeable)
		{
			return;
		}

		// add up to the current acre for each row we pass
		acres.map((_, index) =>
		{
			if (++index % town.game.mapX === 0 && index <= newSelectedAcreId)
			{
				newCurrentAcre = String.fromCharCode(newCurrentAcre.charCodeAt(0) + 1);
			}
		});

		setSelectedAcreId(newSelectedAcreId);
		setCurrentAcre(newCurrentAcre);
		setSelectedPaletteParentId(styleMapTile.parent_id);
		setSelectedPaletteChildId1(styleMapTile.child_id1);
		setSelectedPaletteChildId2(styleMapTile.child_id2);
		setSelectedStyleId(styleMapTile.id);
	};

	const handlePaletteChange = (parentTile: MapMakerProps['mapTiles']['all'][number] | MapMakerProps['mapTiles']['org'][number]['paletteGroups'][number]['parentMapTile'] | undefined, paletteGroupId: number, paletteGroup: string): void =>
	{
		let newSelectedStyleId: number | undefined = 0;
		let newSelectedPaletteParentId = selectedPaletteParentId;
		let newSelectedPaletteChildId1: number | null = selectedPaletteChildId1;
		let newSelectedPaletteChildId2: number | null = selectedPaletteChildId2;

		if (paletteGroup === 'Parent' && parentTile)
		{
			newSelectedStyleId = parentTile.id;
			newSelectedPaletteParentId = Number(paletteGroupId);

			newSelectedPaletteChildId1 = parentTile.child_id1;
			newSelectedPaletteChildId2 = parentTile.child_id2;
		}
		else if (paletteGroup === 'Child1')
		{
			newSelectedPaletteChildId1 = Number(paletteGroupId);

			// if current combo doesn't exist, update child2
			if (!mapTiles.all
				.some(smt => newSelectedPaletteParentId === smt.parent_id &&
					newSelectedPaletteChildId1 === smt.child_id1 &&
					newSelectedPaletteChildId2 === smt.child_id2))
			{
				newSelectedPaletteChildId2 = Number(mapTiles.all
					.find(smt => newSelectedPaletteParentId === smt.parent_id &&
						newSelectedPaletteChildId1 === smt.child_id1)?.child_id2 || 0);
			}
		}
		else if (paletteGroup === 'Child2')
		{
			newSelectedPaletteChildId2 = Number(paletteGroupId);
		}

		if (['Child1', 'Child2'].includes(paletteGroup))
		{
			// figure out style tile auto-selected from palette group
			parentTile = mapTiles.all
				.find(smt => newSelectedPaletteParentId === smt.parent_id &&
					newSelectedPaletteChildId1 === smt.child_id1 &&
					newSelectedPaletteChildId2 === smt.child_id2);

			newSelectedStyleId = parentTile?.id;
		}

		let array: TownType['mapTiles'] = checkUnique((parentTile as any), mapTiles.grassTileId);
		array[selectedAcreId] = (newSelectedStyleId as any);

		setAcres(array);
		setSelectedPaletteParentId(newSelectedPaletteParentId);
		setSelectedPaletteChildId1(newSelectedPaletteChildId1);
		setSelectedPaletteChildId2(newSelectedPaletteChildId2);
		setSelectedStyleId((newSelectedStyleId as any));
	};

	const handleStyleChange = (styleMapTile: MapMakerProps['mapTiles']['all'][number]): void =>
	{
		// AC:GC Track Tiles is changed at the style level, not palette level
		// so need to check for 'only 1 unique tile on map' here too
		let array: TownType['mapTiles'] = checkUnique(styleMapTile, acres[selectedAcreId]);

		// replace selected tile in map with selected style image
		array[selectedAcreId] = styleMapTile.id;

		setAcres(array);
		setSelectedStyleId(styleMapTile.id);
	};

	// Check 'only 1 unique tile of this on the map'
	const checkUnique = (smt: MapMakerProps['mapTiles']['all'][number], replaceTileId: number): TownType['mapTiles'] =>
	{
		let array = [...acres];

		// check whether currently selected image is in a unique group
		if (mapTiles.uniqueGroups.some(up => [smt.parent_id, smt.child_id1, smt.child_id2].includes(up)))
		{
			// if so, check to see if the image is already in the map
			// AND isn't the currently selected acre
			let index = array.indexOf(smt.id);

			if (index !== -1 && index !== selectedAcreId)
			{
				// if so, switch them
				array[index] = replaceTileId;
			}
		}

		return array;
	};

	return (
		<div className='MapMaker'>
			<div className='MapMakerPage_description'>
				To create your town map click on the acre you want to change. From there you are given the possible options for the acre on the right. Continue this process until you've successfully created your town map.
			</div>

			<div className='MapMaker_grid'>
				<Map
					game={town.game}
					mapTiles={acres}
					selectedAcreId={selectedAcreId}
					onClickHandler={handleAcreChange}
				/>

				<div className='MapPalette'>
					{mapTiles.org.map(mapTile =>
					{
						let child2Group = false;

						if (selectedPaletteChildId2 !== null)
						{
							child2Group = mapTile.paletteGroups
								.some(pg => selectedPaletteChildId2 === pg.parentMapTile.child_id1);
						}

						return (
							<div key={mapTile.paletteGroupId} className='Palette'>
								<h4 className={'PaletteHeader' + (mapTile.paletteDisplay
									? ' hidden' : '')}
								>
									{mapTile.paletteGroupName}
								</h4>
								<div className='PaletteGroups'>
									{mapTile.paletteGroups.map(paletteGroup =>
									{
										let group = '';
										const parentTile = paletteGroup.parentMapTile;

										if (parentTile.parent_id === paletteGroup.groupId)
										{
											group = 'Parent';
										}
										else if (child2Group === true)
										{
											group = 'Child2';
										}
										else
										{
											group = 'Child1';
										}

										// show the tile IF
										// 1) (parent) current acre is one of tile's acres AND
										// 2) (parent) its parent matches rendered group OR
										// 3a) (children) one of its style tiles matches selected parent AND
										// 3b) we're not rendering a child2 group OR
										// 3c) we are and the style tile matches selected child1
										const check = paletteGroup.acres.some(acre => acre === currentAcre) &&
											(parentTile.parent_id === paletteGroup.groupId ||
												paletteGroup.styleMapTiles
													.some(smt => smt.parent_id === selectedPaletteParentId &&
													(child2Group === false ||
														child2Group === true &&
															smt.child_id1 === selectedPaletteChildId1

													),
													)
											);

										return (
											<div key={paletteGroup.groupId} className='PaletteGroup'>
												<h5 className={'PaletteHeader' + (mapTile.paletteDisplay
													? '' : ' hidden')}
												>
													{paletteGroup.groupName}
												</h5>
												<div className={check ? '' : 'hidden'}
													onClick={() =>
														handlePaletteChange(parentTile,
															paletteGroup.groupId, group)}
												>
													<img className={[selectedPaletteParentId,
														selectedPaletteChildId1,
														selectedPaletteChildId2]
															.includes(paletteGroup.groupId)
														? 'selected' : ''}
													src={mapDir + parentTile.img_name}
													alt='Map Tile'
													/>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
					<div className='Palette'>
						<h4 className='PaletteHeader'>
							Style Tiles
						</h4>
						<div className='PaletteGroups'>
							{mapTiles.all
								.filter(smt => !smt.unchangeable &&
									selectedPaletteParentId === smt.parent_id &&
									selectedPaletteChildId1 === smt.child_id1 &&
									selectedPaletteChildId2 === smt.child_id2,
								)
								.map(styleMapTile =>
								{
									return (
										<div key={styleMapTile.id}
											className='PaletteGroup'
											onClick={() => handleStyleChange(styleMapTile)}
										>
											<img alt='Map Tile'
												className={selectedStyleId === styleMapTile.id ?
													'selected' : ''}
												src={mapDir + styleMapTile.img_name}
											/>
										</div>
									);
								})}
						</div>
					</div>
				</div>
			</div>

			<Form action='v1/town/map/save' callback={`/profile/:userId/town/${town.id}`} showButton>
				<input type='hidden' name='townId' value={town.id} />
				<input type='hidden' name='acres' value={acres.join(',')} />
			</Form>
		</div>
	);
};

type MapMakerProps = {
	town: TownType
	mapTiles: MapTilesType
};

export default MapMaker;
