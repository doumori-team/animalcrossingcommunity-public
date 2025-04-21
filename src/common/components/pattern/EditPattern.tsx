import { useState } from 'react';
import { Link } from 'react-router';

import { RequireClientJS } from '@behavior';
import { utils, constants } from '@utils';
import { PatternType } from '@types';
import { ACGameType, PatternPalettesType, PatternColorsType, PatternColorInfoType } from '@types';
import { Form, Text, Switch, Alert } from '@form';
import PatternMaker from '@/components/pattern/PatternMaker.tsx';
import { ErrorMessage } from '@layout';
import UploadQRCode from '@/components/pattern/UploadQRCode.tsx';

const EditPattern = ({
	pattern,
	acgames,
	townId,
	characterId,
	userId,
}: EditPatternProps) =>
{
	const [qrData, setQrData] = useState<any | null>(null);
	const [paletteId, setPaletteId] = useState<number>(1);
	const [errors, setErrors] = useState<string[]>([]);
	const [patternName, setPatternName] = useState<string>('');

	const exclusive = acgames.length === 1;

	const initialGameId = () =>
	{
		if (pattern)
		{
			return pattern.gameId;
		}

		if (qrData)
		{
			return constants.gameIds.ACNL;
		}

		if (exclusive)
		{
			return acgames[0].id;
		}

		return constants.gameIds.ACNH;
	};

	let callback = '/pattern/:id';

	// If character ID is set, assume this is a door pattern and not a town flag
	// Will only save to the character db, but still redirect back to the town
	// If no character ID, save to the down (by ID) and not "0"
	const saveTownId = characterId ? 0 : townId;

	if (townId && userId)
	{
		callback = `/profile/${encodeURIComponent(userId)}/town/${townId}`;
	}

	const allPatternPalettes = utils.getPatternPalettes();
	const patternPalettes = exclusive ?
		Object.fromEntries(
			Object.entries(allPatternPalettes).filter(([key, _]) => key === `${acgames[0].id}`),
		) :
		allPatternPalettes;

	const allPatternColors = utils.getPatternColors();
	const patternColors = exclusive ?
		Object.fromEntries(
			Object.entries(allPatternColors).filter(([key, _]) => key === `${acgames[0].id}`),
		) :
		allPatternColors;

	const allPatternColorInfo = utils.getPatternColorInfo();
	const patternColorInfo = exclusive ?
		Object.fromEntries(
			Object.entries(allPatternColorInfo).filter(([key, _]) => key === `${acgames[0].id}`),
		) :
		allPatternColorInfo;

	return (
		<section className='EditPattern'>
			<h1>
				{pattern ? `Edit an ${pattern.gameShortName} Pattern` : 'Create a Pattern'}
			</h1>

			{errors.map(
				(identifier, index) =>
					<ErrorMessage identifier={identifier} key={index} />,
			)}
			<Form action='v1/pattern/save' callback={callback} showButton>
				<input type='hidden' name='townId' value={saveTownId ? saveTownId : 0} />
				<input type='hidden' name='characterId' value={characterId ? characterId : 0} />
				<input type='hidden' name='id' value={pattern ? pattern.id : 0} />

				<Form.Group>
					<Text
						name='patternName'
						required
						label='Pattern Name'
						maxLength={constants.max.patternName}
						value={pattern ? pattern.name : patternName}
						className='text-full'
					/>
				</Form.Group>
				<Form.Group>
					<Switch
						name='published'
						label='Complete'
						value={pattern && pattern.published ? true : false}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='designId'
						label='Design ID'
						placeholder={constants.placeholders.designId}
						pattern={constants.regexes.designId}
						maxLength={17}
						minLength={17}
						value={pattern && pattern.designId ? pattern.designId : ''}
					/>
				</Form.Group>

				{!pattern &&
					<RequireClientJS>
						<div className='EditPattern_upload'>
							<h3>Upload QR code:</h3>
							<Alert type='info'>
								Most QR codes from NL will work to upload to ACC. Note that not all QR codes found across the internet will work due to using online generators vs. generating them right from the game. The QR Code reader also can not read multiple QR codes in one image. You will need to break the image up to upload it. Make sure it's of high enough quality to be read. If you upload a QR code generated from an online generator, any transparent coloring will be replaced with white. If you find that your QR code is not working, please post on the <Link to={`/forums/${constants.boardIds.siteSupport}`}>Site Support board</Link> and a developer will review.
							</Alert>
							<UploadQRCode
								setQrData={setQrData}
								setPaletteId={setPaletteId}
								setErrors={setErrors}
								setPatternName={setPatternName}
							/>
						</div>
					</RequireClientJS>
				}

				<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
					{qrData ?
						<PatternMaker
							key={Math.random()}
							data={qrData}
							initialDataUrl=''
							gamePalettes={utils.getPatternPalettes() as PatternPalettesType[number]}
							gameColors={utils.getPatternColors() as PatternColorsType[number]}
							acgames={acgames}
							initialGameId={initialGameId()}
							initialPaletteId={paletteId}
							gameColorInfo={utils.getPatternColorInfo() as PatternColorInfoType[number]}
						/>
						:
						<PatternMaker
							key='main'
							data={pattern ? pattern.data : null}
							initialDataUrl={pattern ? pattern.dataUrl : ''}
							gamePalettes={patternPalettes as PatternPalettesType[number]}
							gameColors={patternColors as PatternColorsType[number]}
							acgames={acgames}
							initialGameId={initialGameId()}
							initialPaletteId={pattern ? pattern.paletteId : 1}
							gameColorInfo={patternColorInfo as PatternColorInfoType[number]}
						/>
					}
				</RequireClientJS>
			</Form>
		</section>
	);
};

type EditPatternProps = {
	acgames: ACGameType[]
	pattern?: PatternType | null
	townId?: number
	characterId?: number
	userId?: number
};

export default EditPattern;
