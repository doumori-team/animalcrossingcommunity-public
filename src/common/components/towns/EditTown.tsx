import { constants, utils } from '@utils';
import { TownType, TownGameType, SeasonsType } from '@types';
import { Form, Check, Select, Text } from '@form';
import { EditKeyboard, InnerSection } from '@layout';

const EditTown = ({
	gameId,
	town,
	season,
	gameInfo,
}: EditTownProps) =>
{
	const { info, fruit, grassShapes, ordinances, stores, pwps, residents, paintColors,
		hemispheres } = gameInfo;

	// Train station shapes, grass shapes, and PWPs have image icons, so these three lines map their filenames.
	// Stations are just numbered 1-15, but grass and PWPs have distinct names and therefore their own TS types.
	const stationOptions = Array.from({ length: 15 }, (_, i) => i + 1).map(n => ({ id: n, name: `Station ${n}` }));
	const grassOptions = grassShapes.map(shape => ({ ...shape, filename: utils.grassTileFilename(shape, season.time) }));
	const pwpOptions = pwps.map(pwp => ({ ...pwp, filename: utils.publicWorkIconUrl(pwp.name) }));
	// Add custom filename logic for island villagers too because "O'Hare" doesn't have the apostrophe stripped on S3
	const gcIslandVillagerOptions = residents.filter(r => r.isIsland === true).map(v => ({ ...v, filename: `${v.name.toLowerCase().replace(/[^a-z]+/g, '')}.png` }));

	const gameAbbrev = utils.getIconDirectoryFromGameID(gameId);

	const callbackURL = town ? `/profile/:userId/town/${town.id}` : `/profile/:userId/towns`;

	return (
		<section className='EditTown'>
			<Form action='v1/town/save' callback={callbackURL} showButton>
				<input type='hidden' name='gameId' value={gameId} />
				<input type='hidden' name='id' value={town ? String(town.id) : ['0']} />

				<div className='EditTown_name'>
					<Form.Group>
						<EditKeyboard
							name='name'
							defaultValue={town ? town.name : ''}
							required={true}
							label='Town Name'
						/>
						{' '}
						<small className='EditTown_gameName'><cite>
							{info.name}
						</cite></small>
					</Form.Group>
				</div>

				<InnerSection>
					<h2 className='EditTown_sectionHeading'>
						<img
							src={`${constants.AWS_URL}/images/icons/fruit.png`}
							className='EditTown_sectionHeadingIcon'
							alt='Fruit'
						/>
						Fruit
					</h2>

					<Form.Group>
						<Check
							options={fruit.regular}
							name='nativeTownFruit'
							defaultValue={town && town.nativeFruit.nativeFruitId ?
								[town.nativeFruit.nativeFruitId] : [fruit.regular[0].id]}
							required
							imageLocation='fruit'
							label='Native Town Fruit'
						/>
					</Form.Group>

					{fruit.island1.length > 0 && fruit.island2.length > 0 &&
						<>
							<Form.Group>
								<label>Native Island Fruit:</label>

								<div className='EditTown_nativeFruit'>
									<Check
										options={fruit.island1}
										name='islandFruitId1'
										defaultValue={town && town.nativeFruit.islandFruitId1 ?
											[town.nativeFruit.islandFruitId1] : [0]}
										imageLocation='fruit'
										hideLabels
										label='Native Island Fruit, Type 1'
									/>

									<Check
										options={fruit.island2}
										name='islandFruitId2'
										defaultValue={town && town.nativeFruit.islandFruitId2 ?
											[town.nativeFruit.islandFruitId2] : [0]}
										imageLocation='fruit'
										hideLabels
										label='Native Island Fruit, Type 2'
									/>
								</div>
							</Form.Group>
						</>
					}

					<Form.Group>
						<Check
							options={fruit.all}
							multiple
							name='fruit'
							defaultValue={town ?
								town.fruit.map(f => f.id) : [0]}
							imageLocation='fruit'
							label='Fruit'
						/>
					</Form.Group>
				</InnerSection>

				<InnerSection>
					<h2 className='EditTown_sectionHeading'>
						<img
							src={`${constants.AWS_URL}/images/icons/villagers.png`}
							className='EditTown_sectionHeadingIcon'
							alt='Villagers'
						/>
						Villagers
					</h2>

					<Form.Group>
						<Select
							hideLabels
							label='Villagers'
							name='residents'
							multiple
							options={residents.filter(r => r.isTown === true)}
							optionsMapping={{ value: 'id', label: 'name' }}
							value={town ? town.residents.map(r => r.id) : []}
							placeholder='Choose residents...'
							size={15}
						/>
					</Form.Group>
				</InnerSection>

				<InnerSection>
					<h2 className='EditTown_sectionHeading'>
						<img
							src={`${constants.AWS_URL}/images/icons/leaf.png`}
							className='EditTown_sectionHeadingIcon'
							alt='Leaf'
						/>
						Additional Information
					</h2>

					{gameId === constants.gameIds.ACNH ?
						<input
							type='hidden'
							name='nookId'
							value={town && town.stores.nook.length > 0 ?
								[String(town.stores.nook[town.stores.nook.length - 1].id)] :
								[String(stores.nooks[0].id)]}
						/>
						:
						<Form.Group>
							<Check
								options={stores.nooks}
								name='nookId'
								defaultValue={town && town.stores.nook.length > 0 ?
									[town.stores.nook[town.stores.nook.length - 1].id] :
									[stores.nooks[0].id]}
								label='Current Nook Store'
								useImageFilename={true}
								imageLocation={`games/${gameAbbrev}/nook`}
							/>
						</Form.Group>
					}

					{gameId === constants.gameIds.ACGC &&
						<>
							<div className='EditTown_island'>
								<Form.Group>
									<EditKeyboard
										name='islandName'
										defaultValue={town && town.island ? town.island.name : ''}
										label='Island Name'
									/>
								</Form.Group>

								<Form.Group>
									<Check
										options={gcIslandVillagerOptions}
										name='islandResidentId'
										defaultValue={town && town.island ?
											[town.island.resident.id] : [0]}
										label='Island Resident'
										imageLocation={`games/${gameAbbrev}/villagers/icons`}
										useImageFilename={true}
									/>
								</Form.Group>
							</div>

							<div className='EditTown_station'>
								<Form.Group>
									<Check
										options={stationOptions}
										name='stationShape'
										defaultValue={town && town.stationShape ?
											[town.stationShape] : [0]}
										imageLocation={`games/${gameAbbrev}/stations`}
										hideName={true}
										label='Train Station Design'
									/>
								</Form.Group>
							</div>
						</>
					}

					{gameId <= constants.gameIds.ACNL &&
						<Form.Group>
							<Check
								options={grassOptions}
								name='grassShapeId'
								defaultValue={town ? [town.grassShape.id] : [grassShapes[0].id]}
								label='Grass Shape'
								imageLocation={`games/${gameAbbrev}/grass`}
								useImageFilename={true}
								hideName={true}
							/>
						</Form.Group>
					}

					{gameId === constants.gameIds.ACWW &&
						<Form.Group>
							<Check
								options={paintColors}
								name='paintId'
								defaultValue={town?.paint ? [town.paint.id] : [0]}
								label='Roof Color'
							/>
						</Form.Group>
					}

					{[constants.gameIds.ACNL, constants.gameIds.ACNH].includes(gameId) &&
						<Form.Group>
							<Check
								options={ordinances}
								name='ordinanceId'
								defaultValue={town && town.ordinance ? [town.ordinance.id] : [ordinances[0].id]}
								label='Current Ordinance'
							/>
						</Form.Group>
					}

					{gameId === constants.gameIds.ACNL &&
						<>
							<Form.Group>
								<Text
									name='dreamAddress'
									label='Dream Address'
									placeholder={constants.placeholders.dreamAddressNL}
									pattern={constants.regexes.dreamAddressNL}
									maxLength={14}
									minLength={14}
									value={town && town.dreamAddress ? town.dreamAddress : ''}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									options={stores.others}
									multiple
									name='stores'
									defaultValue={town ?
										town.stores.others.map(s => s.id) :
										[0]}
									label='Other Shops and Amenities'
									imageLocation={`games/${gameAbbrev}/amenities`}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									options={pwpOptions}
									multiple
									name='pwps'
									defaultValue={town ? town.pwps.map(p => p.id) : [0]}
									label='Public Work Project(s)'
									imageLocation={`games/${gameAbbrev}/works`}
									useImageFilename={true}
								/>
							</Form.Group>
						</>
					}

					{gameId === constants.gameIds.ACNH &&
						<>
							<Form.Group>
								<Text
									name='dreamAddress'
									label='Dream Address'
									placeholder={constants.placeholders.dreamAddressNH}
									pattern={constants.regexes.dreamAddressNH}
									maxLength={17}
									minLength={17}
									value={town && town.dreamAddress ? town.dreamAddress : ''}
								/>
							</Form.Group>

							<Form.Group>
								<Check
									options={hemispheres}
									name='hemisphereId'
									defaultValue={town && town.hemisphere ?
										[town.hemisphere.id] : [hemispheres[0].id]}
									label='Hemisphere'
								/>
							</Form.Group>
						</>
					}
				</InnerSection>
			</Form>
		</section>
	);
};

type EditTownProps = {
	gameId: number
	gameInfo: TownGameType
	season: SeasonsType
	town?: TownType
};

export default EditTown;
