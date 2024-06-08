import React, { useState } from 'react';
import PropTypes from 'prop-types';
import jsQR from 'jsqr';
import { Link } from 'react-router-dom';

import { RequireClientJS } from '@behavior';
import { utils, constants } from '@utils';
import { patternShape, acgameShape } from '@propTypes';
import { Form, Text, Switch, Alert } from '@form';
import PatternMaker from '@/components/pattern/PatternMaker.js';
import { UserError } from '@errors';
import { ErrorMessage } from '@layout';

const EditPattern = ({pattern, acgames, townId, userId}) =>
{
	const [qrData, setQrData] = useState(null);
	const [paletteId, setPaletteId] = useState(1);
	const [errors, setErrors] = useState([]);
	const [patternName, setPatternName] = useState('');

	let callback = '/pattern/:id';

	if (townId > 0)
	{
		callback = `/profile/${encodeURIComponent(userId)}/towns`;
	}

	// use third-party library to read uploaded QR code
	const scanFile = (e) =>
	{
		const file = e.target.files[0];

		if (typeof file == 'undefined')
		{
			return;
		}

		// 100 KB max size
		if (file.size > 100000)
		{
			setErrors(['qr-code-file-size-too-large']);

			return;
		}

		const fileReader = new FileReader();

		fileReader.onload = function(theFile)
		{
			const image = new Image();

			image.onload = function()
			{
				const canvas = document.createElement('canvas');
				canvas.width = this.width;
				canvas.height = this.height;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				const imageData = ctx.getImageData(0, 0, this.width, this.height);

				const data = jsQR(imageData.data, imageData.width, imageData.height, {inversionAttempts: 'dontInvert'});

				try
				{
					prepareQRData(data);
				}
				catch (e)
				{
					console.error(e);
					setErrors(e.identifiers);
				}
			};

			image.src = theFile.target.result;
		};

		fileReader.readAsDataURL(file);
	}

	const prepareQRData = (data) =>
	{
		if (!data)
		{
			throw new UserError('bad-format');
		}

		let qrData = data.binaryData;

		qrData = qrData.map(id =>
		{
			if (isNaN(id))
			{
				throw new UserError('bad-format');
			}

			return Number(id);
		});

		if (qrData === undefined || qrData.length !== constants.pattern.qrCodeLength)
		{
			throw new UserError('bad-format');
		}

		const returnVal = decodedQRCode(qrData);

		setQrData(returnVal.data);
		setPaletteId(returnVal.paletteId);
		setErrors([]);
		setPatternName(returnVal.patternName);
	}

	const decodedQRCode = (qrData) =>
	{
		// Decode name
		const nameEncoded = [...qrData].splice(0, 42);
		let name = '';

		for (let i = 0; i < nameEncoded.length; i += 2)
		{
			let char = nameEncoded[i];

			if (nameEncoded[i+1] === 0 && char !== 0)
			{
				name += String.fromCharCode(char);
			}
		}

		// Decoding author and town name is possible (same as decoding pattern
		// name), but author will become the ACC user and town name 'ACC'

		// Decode palette
		const paletteEncoded = [...qrData].splice(88, 15);
		let palette = [], ind = 0;

		for (let i = 0; i < paletteEncoded.length; i++)
		{
			let hex = paletteEncoded[i].toString(16), paletteHexdec = '';

			// 145-158
			if (hex.substr(1) === 'f')
			{
				paletteHexdec = parseInt(hex.substr(0, 1), 16) + 144;
			}
			// 144
			else if (hex === 'f')
			{
				paletteHexdec = 144;
			}
			else if (hex == 0)
			{
				paletteHexdec = 0;
			}
			// 1-143
			else
			{
				let second = hex.substr(1, 1), first = hex.substr(0, 1);

				for (let x = 0; x <= 143; x++)
				{
					if (Math.floor(x / 9).toString(16) === first && (x % 9).toString(16) === second)
					{
						paletteHexdec = x;
						break;
					}
				}
			}

			palette[ind] = paletteHexdec;
			ind++;
		}

		// need to figure out paletteId for pattern/:id page
		const nlColors = utils.getPatternColors(constants.gameIds.ACNL);
		const nlPalettes = utils.getPatternPalettes(constants.gameIds.ACNL);
		let paletteId = 1, highestNumber = 0;
		const paletteColors = palette.map(x => nlColors[x]);

		// figure out which palette has the most colors
		for (let i = 0; i < nlPalettes.length; i++)
		{
			let incColorsNum = paletteColors.filter(x => nlPalettes[i].colors.includes(x)).length;

			if (highestNumber < incColorsNum)
			{
				paletteId = nlPalettes[i].paletteId;
				highestNumber = incColorsNum;
			}
		}

		// Decode data
		const dataEncoded = [...qrData].splice(108, 512);
		let formData = [], index = 0;

		for (let i = 0; i < constants.pattern.paletteLength; i++)
		{
			formData[i] = [];
		}

		// row by row
		for (let y = 0;  y < constants.pattern.paletteLength; y++)
		{
			for (let x = 0; x < constants.pattern.paletteLength; x += 2)
			{
				let hex = dataEncoded[index].toString(16);
				index++;

				let first = hex.substr(0, 1);
				let second = hex.substr(1, 1);

				if (hex.length === 1)
				{
					second = first;
					first = 0;
				}

				// if uploading something from online created with NL colors but transparent
				// use white instead for transparent (number 144 in all-colors list)
				let paletteIndex = parseInt(second, 16);

				if (paletteIndex === 15)
				{
					formData[x][y] = '#ffffff';
				}
				else
				{
					formData[x][y] = nlColors[palette[paletteIndex]];
				}

				paletteIndex = parseInt(first, 16);

				if (paletteIndex === 15)
				{
					formData[x+1][y] = '#ffffff';
				}
				else
				{
					formData[x+1][y] = nlColors[palette[paletteIndex]];
				}

				if (typeof formData[x][y] == 'undefined' || typeof formData[x+1][y] == 'undefined')
				{
					throw new UserError('bad-format');
				}
			}
		}

		return {
			data: formData.flat(2),
			paletteId: paletteId,
			patternName: name,
		};
	}

	return (
		<section className="EditPattern">
			{errors.map(
				(identifier, index) =>
					(<ErrorMessage identifier={identifier} key={index} />)
			)}
			<Form action='v1/pattern/save' callback={callback} showButton>
				<input type='hidden' name='townId' value={townId ? townId : 0} />
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
						value={pattern ? pattern.designId : ''}
					/>
				</Form.Group>

				{!pattern && (
					<RequireClientJS>
						<div className='EditPattern_upload'>
							<h3>Upload QR code:</h3>
							<Alert type='info'>
								Most QR codes from NL will work to upload to ACC. Note that not all QR codes found across the internet will work due to using online generators vs. generating them right from the game. The QR Code reader also can not read multiple QR codes in one image. You will need to break the image up to upload it. Make sure it's of high enough quality to be read. If you upload a QR code generated from an online generator, any transparent coloring will be replaced with white. If you find that your QR code is not working, please post on the <Link to={`/forums/${constants.boardIds.siteSupport}`}>Site Support board</Link> and a developer will review.
							</Alert>
							<input type='file' accept='image/*' onChange={scanFile} />
						</div>
					</RequireClientJS>
				)}

				<RequireClientJS fallback={<ErrorMessage identifier='javascript-required' />}>
					{qrData ? (
						<PatternMaker
							key={Math.random()}
							data={qrData}
							initialDataUrl=''
							gamePalettes={utils.getPatternPalettes()}
							gameColors={utils.getPatternColors()}
							acgames={acgames}
							initialGameId={constants.gameIds.ACNL}
							initialPaletteId={paletteId}
							gameColorInfo={utils.getPatternColorInfo()}
						/>
					) : (
						<PatternMaker
							key={'main'}
							data={pattern ? pattern.data : null}
							initialDataUrl={pattern ? pattern.dataUrl : ''}
							gamePalettes={utils.getPatternPalettes()}
							gameColors={utils.getPatternColors()}
							acgames={acgames}
							// if creating a new pattern, start with AC:NH
							initialGameId={pattern ? pattern.gameId : constants.gameIds.ACNH}
							initialPaletteId={pattern ? pattern.paletteId : 1}
							gameColorInfo={utils.getPatternColorInfo()}
						/>
					)}
				</RequireClientJS>
			</Form>
		</section>
	);
}

EditPattern.propTypes = {
	acgames: PropTypes.arrayOf(acgameShape),
	pattern: patternShape,
	townId: PropTypes.number,
	userId: PropTypes.number,
};

export default EditPattern;
