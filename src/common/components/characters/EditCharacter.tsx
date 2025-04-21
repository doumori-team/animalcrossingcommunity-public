import { constants, utils } from '@utils';
import { CharacterType, CharacterGameType, TownType } from '@types';
import { Form, Check, Text } from '@form';
import { EditKeyboard, Keyboard } from '@layout';

const EditCharacter = ({
	character,
	town,
	gameInfo,
}: EditCharacterProps) =>
{
	const { info, houseSizes, bedLocations, faces, paintColors, monuments } = gameInfo as CharacterGameType;
	const gameAbbrev = utils.getIconDirectoryFromGameID(town.game.id);

	return (
		<div className='EditCharacter'>
			<Form action='v1/character/save' callback={`/profile/:userId/town/${town.id}`} showButton>
				<input type='hidden' name='id' value={character ? character.id : 0} />
				<input type='hidden' name='townId' value={town.id} />

				<h1 className='EditCharacter_name'>
					<Form.Group>
						<EditKeyboard
							name='name'
							defaultValue={character ? character.name : ''}
							required={true}
							label='Character Name'
						/>
						{' '}
						<small className='EditCharacter_townName'><cite>
							<Keyboard
								name={town.name}
								gameId={town.game.id}
							/> ({town.game.shortname})
						</cite></small>
					</Form.Group>
				</h1>

				<div className='EditCharacter_section'>
					<Form.Group>
						<Text
							type='number'
							name='bells'
							label='Bells'
							value={character?.bells ?? 0}
							max={constants.max.number}
						/>
					</Form.Group>

					{info.id === constants.gameIds.ACNH &&
						<>
							<Form.Group>
								<Text
									type='number'
									name='nookMiles'
									label='Nook Miles'
									value={character?.nookMiles ?? 0}
									max={constants.max.number}
								/>
							</Form.Group>

							<Form.Group>
								<Text
									name='happyHomeNetworkId'
									label='Happy Home Network ID'
									placeholder={constants.placeholders.happyHomeNetworkId}
									pattern={constants.regexes.happyHomeNetworkId}
									maxLength={17}
									minLength={17}
									value={character && character.happyHomeNetworkId ?
										character.happyHomeNetworkId : ''}
								/>
							</Form.Group>

							<Form.Group>
								<Text
									name='creatorId'
									label='Creator ID'
									placeholder={constants.placeholders.creatorId}
									pattern={constants.regexes.creatorId}
									maxLength={17}
									minLength={17}
									value={character && character.creatorId ?
										character.creatorId : ''}
								/>
							</Form.Group>
						</>
					}

					<Form.Group>
						<Text
							type='number'
							name='debt'
							label='Nook Debt'
							value={character?.debt ?? 0}
							max={constants.max.number}
						/>
					</Form.Group>

					{info.id === constants.gameIds.ACGC &&
						<Form.Group>
							<Check
								options={monuments}
								name='monumentId'
								defaultValue={character?.monument ? [character.monument.id] : [0]}
								label='Train Station Monument'
							/>
						</Form.Group>
					}

					{bedLocations.length > 0 &&
						<Form.Group>
							<Check
								options={bedLocations}
								name='bedLocationId'
								defaultValue={character ? [character.bedLocation.id] : [0]}
								imageLocation='character'
								useImageFilename
								hideName
								label={info.id === constants.gameIds.ACWW ? 'Bed Location' : 'House Location'}
							/>
						</Form.Group>
					}

					{(info.id === constants.gameIds.ACGC || info.id === constants.gameIds.ACCF) &&
						<Form.Group>
							<Check
								options={paintColors}
								name='paintId'
								defaultValue={character?.paint ? [character.paint.id] : [0]}
								label='Roof Color'
							/>
						</Form.Group>
					}

					<Form.Group>
						<label>House Size:</label>

						{houseSizes.map(hs =>
						{
							const foundHouseSize = character ?
								character.houseSizes.find(chs => chs.groupId === hs.groupId) :
								false;

							return (
								<div className='EditCharacter_houseSizes' key={hs.groupId}>
									<Check
										options={hs.houseSizes}
										name='houseSizeIds'
										defaultValue={foundHouseSize ? [foundHouseSize.id] : [0]}
										multiple
										hideLabels
										label='House Size Group'
									/>
								</div>
							);
						})}
					</Form.Group>

					<Form.Group>
						<Text
							type='number'
							name='hraScore'
							value={character?.hraScore ?? 0}
							label={`${town.game.id <= constants.gameIds.ACCF ? 'HRA' : 'HHA'} Score`}
							max={constants.max.number}
						/>
					</Form.Group>

					{faces.length > 0 &&
						<Form.Group>
							<Check
								options={faces}
								name='faceId'
								defaultValue={character ? [character.face.id] : [0]}
								imageLocation={`games/${gameAbbrev}/humans/full`}
								useImageFilename
								hideName
								label='Face'
							/>
						</Form.Group>
					}
				</div>
			</Form>
		</div>
	);
};

type EditCharacterProps = {
	character?: CharacterType
	town: TownType | CharacterType['town']
	gameInfo: CharacterGameType
};

export default EditCharacter;
