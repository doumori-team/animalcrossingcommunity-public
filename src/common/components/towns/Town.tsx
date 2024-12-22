import React from 'react';
import { Link } from 'react-router-dom';

import { RequireUser } from '@behavior';
import { constants, utils } from '@utils';
import { SeasonsType, TownType } from '@types';
import { Keyboard, Grid, InnerSection, ReportProblem } from '@layout';
import Map from '@/components/towns/Map.tsx';
import Tune from '@/components/tunes/Tune.tsx';
import { UserContext } from '@contexts';
import { Confirm } from '@form';
import Character from '@/components/characters/Character.tsx';
import Pattern from '@/components/pattern/Pattern.tsx';

const Town = ({ town, season }: TownProps) =>
{
	const {
		id,
		name,
		game,
		userId,
		fruit,
		nativeFruit,
		grassShape,
		dreamAddress,
		ordinance,
		stores,
		pwps,
		residents,
		island,
		characters,
		mapTiles,
		hemisphere,
		tune,
		museum,
		mapDesignData,
		flag,
		stationShape,
		paint,
	} = town;

	const encodedId = encodeURIComponent(id);
	const encodedUserId = encodeURIComponent(userId);

	const gameAbbrev = utils.getIconDirectoryFromGameID(game.id);

	/* 
    * Get just the filename for any museum item 
    */
	const museumFileName = (category: string, itemName: string): string =>
	{
		const canBeFake =
            ['Artwork', 'Paintings', 'Sculptures', 'Fine-Art Paintings'].includes(category) &&
            (game.id === constants.gameIds.ACNL || game.id === constants.gameIds.ACNH);
		// Museum filenames don't 100% follow a strict convention, so this looks a little janky
		return `${itemName.
            toLowerCase().
            replace(' - real', '').
            replace(/-/g, '').
            replace(/t(?:\. ?)?rex/, game.id === constants.gameIds.ACNH ? 't_rex' : 't-rex').
            replace('sharktooth', 'shark-tooth').
            replace('rockhead', 'rock-head').
            replace(/[^a-z\-\s_]/g, '').
            replace(/\s+/g, '_')
		}${canBeFake ? '_genuine' : ''}`;
	};

	const museumItemIconUrl = (category: string, itemName: string): string =>
	{
		const filename = `${museumFileName(category, itemName)}.png`;

		if (['Bugs', 'Insects', 'Fish', 'Sea Creatures', 'Seafood'].includes(category))
		{
			return `${constants.AWS_URL}/images/icons/creatures/${gameAbbrev}/${filename}`;
		}

		if (category === 'Artwork' || category === 'Fossils')
		{
			return `${constants.AWS_URL}/images/games/${gameAbbrev}/${category.toLowerCase()}/${filename}`;
		}

		if (['Paintings', 'Sculptures', 'Fine-Art Paintings'].includes(category))
		{
			return `${constants.AWS_URL}/images/games/${gameAbbrev}/artwork/${filename}`;
		}

		return '';
	};

	return (
		<section className='Town'>
			<RequireUser id={userId} silent permission='modify-towns'>
				<div className='Town_links'>
					<Link to={`/profile/${encodedUserId}/town/${encodedId}/edit`}>
						Edit
					</Link>
					<Confirm
						action='v1/town/destroy'
						callback={`/profile/${encodedUserId}/towns`}
						id={id}
						label='Delete'
						message='Are you sure you want to delete this town?'
					/>
					{game.id === constants.gameIds.ACNH && mapDesignData && mapDesignData.dataUrl.length === 0 &&
                        <Link to={`/profile/${encodedUserId}/town/${encodedId}/map`}>
	Add Map
                        </Link>
					}
				</div>
			</RequireUser>

			<h1 className='Town_name'>
				<div>
					<ReportProblem type={constants.userTicket.types.town} id={id} />
					<Keyboard name={name} gameId={game.id} />
				</div>
				{' '}
				<small className='Town_gameName'><cite>{game.name}</cite></small>
			</h1>

			<div className='TownPanelContainer'>
				<div className='TownPanel TownLeftPanel'>
					{(mapTiles.length > 0 || mapDesignData && mapDesignData.dataUrl.length > 0) &&
						<div className={`Town_map Town_map_${game.identifier}`}>
							{game.id === constants.gameIds.ACNH && mapDesignData ?
								<img
									className={`Town_map_${game.identifier}`}
									src={mapDesignData.dataUrl}
									alt='AC:NH Map'
								/>
								:
								<Map game={game} mapTiles={mapTiles} />
							}
							<div>
								<ReportProblem type={constants.userTicket.types.map} id={id} />
								<RequireUser id={userId} silent>
									<Link to={`/profile/${encodedUserId}/town/${encodedId}/map`}
										className='Town_mapEditLink'
									>Edit Map</Link>
								</RequireUser>
							</div>
						</div>
					}
					<InnerSection>
						<h2 className='Town_sectionHeading'>
							<div className='Town_characterHeader'>
								<div>
									<img src={`${constants.AWS_URL}/images/icons/character.png`}
										className='Town_sectionHeadingIcon' alt='Characters'
									/>
									Characters
								</div>
								<RequireUser id={userId} silent>
									<Link to={`/profile/${encodedUserId}/characters/add/${encodedId}`}
										className='Town_button'
									>Add</Link>
								</RequireUser>
							</div>
						</h2>
						<Grid options={characters} message={
							<UserContext.Consumer>
								{currentUser => currentUser && currentUser.id === userId ?
									<div>
										{'You have no characters set up. '}
										<Link to={`/profile/${encodedUserId}/characters/add/${encodedId}`}>{'Click here'}</Link>
										{' to add a new character.'}
									</div>
									:
									'No characters in this town.'
								}
							</UserContext.Consumer>
						}
						>
							{characters.map(character =>
								<Character key={character.id} {...character} />,
							)}
						</Grid>
					</InnerSection>
				</div>
				<div className='TownPanel TownRightPanel'>
					{tune ?
						<InnerSection>
							<Tune townId={id} tune={tune} townUserId={userId} />
						</InnerSection>
						:
						<RequireUser id={userId} silent>
							<InnerSection>
								<Link to={`/profile/${encodedUserId}/town/${encodedId}/tune`}
									className='Town_button'
								>
									Add Town Tune
								</Link>
							</InnerSection>
						</RequireUser>
					}

					{flag ?
						<InnerSection>
							<Pattern townId={id} pattern={flag} userId={userId} />
						</InnerSection>
						:
						<RequireUser id={userId} silent>
							<InnerSection>
								<Link to={`/profile/${encodedUserId}/town/${encodedId}/pattern`}
									className='Town_button'
								>
									{town.game.id === constants.gameIds.ACGC ? 'Add Island Flag' : 'Add Town Flag'}
								</Link>
							</InnerSection>
						</RequireUser>
					}

					<InnerSection>
						<h2 className='Town_sectionHeading'>
							<img src={`${constants.AWS_URL}/images/icons/villagers.png`} className='Town_sectionHeadingIcon' alt='Villagers' />
							Villagers
						</h2>
						{residents.length > 0 ?
							<ul className='Town_villagers'>
								{residents.map(({ id, name }) =>
									<li key={id}>
										<div className='Town_villagerIcon'>
											<img src={utils.villagerIconUrl(name, game.id)} alt={name} />
										</div>
										<div className='Town_villagerName'>
											{name}
										</div>
									</li>,
								)}
							</ul>
							:
							'None'
						}
					</InnerSection>

					<InnerSection>
						<h2 className='Town_sectionHeading'>
							<img src={`${constants.AWS_URL}/images/icons/fruit.png`} className='Town_sectionHeadingIcon' alt='Fruit' />
							Fruit
						</h2>
						{fruit.length > 0 ?
							<>
								<ul className='Town_fruit'>
									{fruit.map(fruit =>
										<li key={fruit.id}>
											<div className='Town_fruitIcon'>
												<img src={`${constants.AWS_URL}/images/games/${gameAbbrev}/produce/icons/${fruit.name.replace(' ', '-')}.png`} alt={fruit.name} />
											</div>
											<div className='Town_fruitName'>
												{fruit.name}{nativeFruit.all.some(f => f.id === fruit.id) && ' (native)'}
											</div>
										</li>,
									)}
								</ul>
							</>
							:
							'None'
						}
					</InnerSection>

					<InnerSection>
						<h2 className='Town_sectionHeading'>
							<img src={`${constants.AWS_URL}/images/icons/museum.png`} className='Town_sectionHeadingIcon' alt='Museum' />
							Museum
						</h2>
						{museum.map(category =>
							<>
								<h3 className='Town_museumSubheading'>{category.name}: {category.count}/{category.total}</h3>
								<ul className='Town_museumProgress'>
									{
										category.items.map(item =>
											<li
												key={`${category.name}-${item.name}`}
												className={`museumItem ${category.name} ${gameAbbrev} ${item.owned ? '' : 'missing'}`}
											>
												<img
													className={museumFileName(category.name, item.name)}
													src={museumItemIconUrl(category.name, item.name)}
													alt={item.name}
													title={item.name}
												/>
											</li>,
										)
									}
								</ul>
							</>,
						)}
					</InnerSection>

					<InnerSection>
						<h2 className='Town_sectionHeading'>
							<img src={`${constants.AWS_URL}/images/icons/leaf.png`} className='Town_sectionHeadingIcon' alt='Additional Information' />
							Additional Information
						</h2>
						<div className='Town_additionalInfo'>

							{game.id !== constants.gameIds.ACNH &&
								<div className='Town_additionalInfoSection'>
									<h3>Shop</h3>
									<div className='Town_additionalInfoContents'>
										{
											stores.nook.length > 0 ?
												<>
													<img
														src={`${constants.AWS_URL}/images/games/${gameAbbrev}/nook/${stores.nook[stores.nook.length - 1].filename}`}
														alt={stores.nook[stores.nook.length - 1].name}
														title={stores.nook[stores.nook.length - 1].name}
													/>
													{game.id !== constants.gameIds.ACGC && <div>{stores.nook[stores.nook.length - 1].name}</div>}
												</>
												: <span>'(not set)'</span>
										}
									</div>
								</div>
							}

							{game.id === constants.gameIds.ACGC && island &&
								<div className='Town_additionalInfoSection'>
									<h3><Keyboard name={island.name} gameId={game.id} /> Island Resident</h3>
									{island.resident &&
                                        <ul className='Town_villagers Town_additionalInfoContents'>
                                        	<li>
                                        		<div className='Town_villagerIcon'>
                                        			<img
                                        				src={utils.villagerIconUrl(island.resident.name, game.id)}
                                        				alt={name}
                                        			/>
                                        		</div>
                                        		<div className='Town_villagerName'>
                                        			{island.resident.name}
                                        		</div>
                                        	</li>
                                        </ul>
									}
								</div>
							}

							{game.id === constants.gameIds.ACGC &&
								<div className='Town_additionalInfoSection'>
									<h3>Train Station Design</h3>
									<div className='Town_additionalInfoContents'>
										{stationShape ?
											<img
												src={`${constants.AWS_URL}/images/games/${gameAbbrev}/stations/station-${stationShape}.png`}
												alt={`Station ${stationShape}`}
												title={`Station ${stationShape}`}
											/> :
											<span>(not set)</span>}
									</div>
								</div>
							}

							{game.id <= constants.gameIds.ACNL &&
								<div className='Town_additionalInfoSection'>
									<h3>Grass Shape</h3>
									<div className='Town_additionalInfoContents'>
										{grassShape.name ?
											<img
												src={`${constants.AWS_URL}/images/games/${gameAbbrev}/grass/${utils.grassTileFilename(grassShape, season.time)}`}
												alt={grassShape.name}
												title={grassShape.name}
											/> :
											<span>'None'</span>
										}
									</div>
								</div>
							}

							{game.id === constants.gameIds.ACWW &&
								<div className='Town_additionalInfoSection'>
									<h3>Roof Color</h3>
									<div className='Town_additionalInfoContents'>
										{paint ?
											<div className='Town_roofColorContainer'>
												<div className='Town_roofColorThumbnail' style={{ backgroundColor: paint.hex }} />
												<div>&nbsp;</div>
												<div>{paint.name}</div>
											</div>
											:
											<div>(not set)</div>
										}
									</div>
								</div>
							}

							{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(game.id) &&
								<>
									<div className='Town_additionalInfoSection'>
										<h3>Dream Address</h3>
										<div className='Town_additionalInfoContents'>
											<span>{dreamAddress ? dreamAddress : 'None'}</span>
										</div>
									</div>
									<div className='Town_additionalInfoSection'>
										<h3>Ordinance</h3>
										<div className='Town_additionalInfoContents'>
											<span>{ordinance.name ? ordinance.name : 'None'}</span>
										</div>
									</div>
								</>
							}

							{game.id === constants.gameIds.ACNL &&
								<>
									<div className='Town_additionalInfoSection'>
										<h3>Other Shops and Amenities</h3>
										<div className='Town_additionalInfoContents'>
											{stores.others.length === 0 ?
												<span>No shops set for this town.</span> :

												<ul className='Town_publicWorks'>
													{stores.others.map(({ name }, index) =>
														<li
															key={index}
															className={`publicWork`}
														>
															<img
																src={`${constants.AWS_URL}/images/games/${gameAbbrev}/amenities/${utils.amenityIconUrl(name)}`}
																alt={name}
																title={name}
															/>
														</li>,
													)}
												</ul>
											}
										</div>
									</div>
									<div className='Town_additionalInfoSection'>
										<h3>Public Work Projects</h3>
										<ul className='Town_publicWorks'>
											{
												pwps.map(({ name }, index) =>
													<li
														key={index}
														className={`publicWork`}
													>
														<img
															src={`${constants.AWS_URL}/images/games/${gameAbbrev}/works/${utils.publicWorkIconUrl(name)}`}
															alt={name}
															title={name}
														/>
													</li>,
												)
											}
										</ul>
									</div>
								</>
							}

							{game.id === constants.gameIds.ACNH && hemisphere &&
								<div className='Town_additionalInfoSection'>
									<h3>Hemisphere</h3>
									<div className='Town_additionalInfoContents'>
										<span>{hemisphere.name ? hemisphere.name : 'None'}</span>
									</div>
								</div>
							}

						</div>

					</InnerSection>
				</div>
			</div>
		</section>
	);
};

type TownProps = {
	town: TownType
	season: SeasonsType
};

export default Town;
