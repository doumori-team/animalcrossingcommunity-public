import jsQR from 'jsqr';

import { utils, constants } from '@utils';
import { ElementInputType } from '@types';
import { UserError } from '@errors';

const UploadQRCode = ({
	setQrData,
	setPaletteId,
	setErrors,
	setPatternName,
}: UploadQRCodeProps) =>
{
	// use third-party library to read uploaded QR code
	const scanFile = (e: ElementInputType) =>
	{
		const file = (e as any).target.files[0];

		if (typeof file === 'undefined')
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

		fileReader.onload = function (theFile: any)
		{
			const image: any = new Image();

			image.onload = function (this: any)
			{
				const canvas = document.createElement('canvas');
				canvas.width = this.width;
				canvas.height = this.height;
				const ctx: any = canvas.getContext('2d');
				ctx.drawImage(image, 0, 0);
				const imageData = ctx.getImageData(0, 0, this.width, this.height);

				const data = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

				try
				{
					prepareQRData(data);
				}
				catch (error: any)
				{
					console.error('Error attempting to create QR code:', error);

					setErrors(error.identifiers);
				}
			};

			image.src = theFile.target.result;
		};

		fileReader.readAsDataURL(file);
	};

	const prepareQRData = (data: any) =>
	{
		if (!data)
		{
			throw new UserError('bad-format');
		}

		let qrData = data.binaryData;

		qrData = qrData.map((id: any) =>
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
	};

	const decodedQRCode = (qrData: any) =>
	{
		// Decode name
		const nameEncoded = [...qrData].splice(0, 42);
		let name = '';

		for (let i = 0; i < nameEncoded.length; i += 2)
		{
			let char = nameEncoded[i];

			if (nameEncoded[i + 1] === 0 && char !== 0)
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
			let hex: string = paletteEncoded[i].toString(16), paletteHexdec: number | string = '';

			// 145-158
			if (hex.substring(1) === 'f')
			{
				paletteHexdec = parseInt(hex.substring(0, 1), 16) + 144;
			}
			// 144
			else if (hex === 'f')
			{
				paletteHexdec = 144;
			}
			else if (hex === '0')
			{
				paletteHexdec = 0;
			}
			// 1-143
			else
			{
				let second = hex.substring(1, 2), first = hex.substring(0, 1);

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
		const paletteColors = palette.map(x => (nlColors as any)[x]);

		// figure out which palette has the most colors
		for (let i = 0; i < (nlPalettes as any).length; i++)
		{
			let incColorsNum = paletteColors.filter(x => (nlPalettes as any)[i].colors.includes(x)).length;

			if (highestNumber < incColorsNum)
			{
				paletteId = (nlPalettes as any)[i].paletteId;
				highestNumber = incColorsNum;
			}
		}

		// Decode data
		const dataEncoded = [...qrData].splice(108, 512);
		let formData: any = [], index = 0;

		for (let i = 0; i < constants.pattern.paletteLength; i++)
		{
			formData[i] = [];
		}

		// row by row
		for (let y = 0; y < constants.pattern.paletteLength; y++)
		{
			for (let x = 0; x < constants.pattern.paletteLength; x += 2)
			{
				let hex = dataEncoded[index].toString(16);
				index++;

				let first = hex.substring(0, 1);
				let second = hex.substring(1, 2);

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
					formData[x][y] = (nlColors as any)[palette[paletteIndex]];
				}

				paletteIndex = parseInt(first, 16);

				if (paletteIndex === 15)
				{
					formData[x + 1][y] = '#ffffff';
				}
				else
				{
					formData[x + 1][y] = (nlColors as any)[palette[paletteIndex]];
				}

				if (typeof formData[x][y] === 'undefined' || typeof formData[x + 1][y] === 'undefined')
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
	};

	return (
		<input type='file' accept='image/*' onChange={scanFile} aria-label='Upload QR code' />
	);
};

type UploadQRCodeProps = {
	setQrData: Function
	setPaletteId: Function
	setErrors: Function
	setPatternName: Function
};

export default UploadQRCode;
