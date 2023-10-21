import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

import QRCode from 'qrcode';
import { Buffer } from 'safe-buffer';

async function save({id, patternName, published, designId, data, dataUrl,
	gamePaletteId, palette, townId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-patterns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const gameId = Number(gamePaletteId.substr(0, gamePaletteId.indexOf('-')) || 0);

	if (isNaN(gameId))
	{
		throw new UserError('no-such-ac-game');
	}

	let [checkId] = await db.query(`
		SELECT id
		FROM ac_game
		WHERE id = $1::int
	`, gameId);

	if (!checkId)
	{
		throw new UserError('no-such-ac-game');
	}

	const paletteId = Number(gamePaletteId.substr(gamePaletteId.indexOf('-')+1) || 0);

	if (paletteId < 1 || paletteId > 16)
	{
		throw new UserError('bad-format');
	}

	const colors = utils.getPatternColors(gameId);

	data = data.map(rgb =>
	{
		let id = colors.indexOf(rgb);

		if (gameId === constants.gameIds.ACNH && Number(rgb) === constants.pattern.transparentColorId)
		{
			id = constants.pattern.transparentColorId;
		}
		else
		{
			if (isNaN(id) || id < 0 || id > (colors.length)-1)
			{
				throw new UserError('bad-format');
			}
		}

		return Number(id);
	});

	const originalData = [...data];

	data = data.map(id =>
	{
		return id.toString(16).padStart(4, '0');
	});

	if (data === undefined || data.length !== constants.pattern.length)
	{
		throw new UserError('bad-format');
	}

	data = data.join('');

	palette = palette.map(id =>
	{
		if (isNaN(id) || !colors[id])
		{
			throw new UserError('bad-format');
		}

		return Number(id);
	});

	if (palette === undefined || palette.length !== constants.pattern.numberOfColors)
	{
		throw new UserError('bad-format');
	}

	if (townId > 0)
	{
		const [town] = await db.query(`
			SELECT town.user_id
			FROM town
			WHERE town.id = $1::int
		`, townId);

		if (town.user_id != this.userId)
		{
			throw new UserError('permission');
		}
	}

	// Perform queries
	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const [qrCodeUrl] = await Promise.all([
		createQRCode.bind(this)(gameId, patternName, user.username, 'ACC', palette, originalData, colors, utils.getPatternColors(constants.gameIds.ACNL)),
	]);

	if (id > 0)
	{
		let [checkPatternId] = await db.query(`
			SELECT pattern.creator_id, pattern.published
			FROM pattern
			WHERE pattern.id = $1::int
		`, id);

		if (!checkPatternId)
		{
			throw new UserError('no-such-pattern');
		}

		if (checkPatternId.creator_id != this.userId)
		{
			throw new UserError('permission');
		}

		if (checkPatternId.published)
		{
			throw new UserError('pattern-published');
		}

		await db.query(`
			UPDATE pattern
			SET name = $1, published = $3::bool, design_id = $8, data = $4, data_url = $5, game_id = $6::int, palette_id = $7::int, qr_code_url = $9
			WHERE id = $2::int
		`, patternName, id, published, data, dataUrl, gameId, paletteId, designId, qrCodeUrl);
	}
	else
	{
		[id] = await db.query(`
			INSERT INTO pattern (name, creator_id, published, design_id, data, data_url, game_id, palette_id, qr_code_url)
			VALUES ($1, $2::int, $3::bool, $8, $4, $5, $6::int, $7::int, $9)
			RETURNING id
		`, patternName, this.userId, published, data, dataUrl, gameId, paletteId, designId, qrCodeUrl);

		id = id.id;
	}

	if (townId > 0)
	{
		await db.query(`
			UPDATE town
			SET flag_id = $1::int, flag_data_url = $3, flag_creator_id = $4, flag_name = $5
			WHERE id = $2::int
		`, id, townId, dataUrl, this.userId, patternName);
	}

	return {
		id: id
	};
}

/*
 * Creates QR Code - if possible - for pattern.
 *
 * parameters:
 * 	gameId - number - the game id used for the pattern
 * 	patternName - string - pattern name
 * 	author - string - who created the pattern
 * 	townName - string - where the author came from
 * 	palette - array - pattern's palette; array of color ids
 * 	data - array - the pattern's colors
 * 	colors - array - current game colors
 * 	nlColors - array - NL & QR Code colors
 */
async function createQRCode(gameId, patternName, author, townName, palette, data, colors, nlColors)
{
	if (!canCreateQRCode(gameId, data, colors, nlColors))
	{
		return null;
	}

	// if non-NL game at this point, it's qualified to have a QR code
	if (gameId !== constants.gameIds.ACNL)
	{
		// need to update palette & data to use NL color indexes
		let newPalette = [], matchingDelta = [];

		for (let i = 0; i < data.length; i++)
		{
			let rgb = colors[data[i]], newRgbIndex = 0;
			let alreadyCalculated = matchingDelta.find(x => x.rgb === rgb);

			if (alreadyCalculated)
			{
				newRgbIndex = alreadyCalculated.index;
			}
			else
			{
				// find closest matching color
				let highestDelta = 0;

				for (let x = 0; x < nlColors.length; x++)
				{
					let delta = hexColorDelta(rgb, nlColors[x]);

					if (delta > highestDelta)
					{
						highestDelta = delta;
						newRgbIndex = x;
					}
				}

				// 'cache' the color
				matchingDelta.push({
					rgb: rgb,
					index: newRgbIndex,
				});
			}

			data[i] = newRgbIndex;

			if (!newPalette.includes(newRgbIndex))
			{
				newPalette.push(newRgbIndex);
			}
		}

		// NOTE: it's ok if the new palette size < 15

		palette = newPalette;
	}

	// initialize array
	let hexbytes = [];

	for (let i = 0; i < constants.pattern.qrCodeLength; i++)
	{
		hexbytes[i] = '00';
	}

	// Pattern name: bytes 0-41
	hexbytes = unicodeEncode(patternName, 0, hexbytes);

	// Unknown purpose: bytes 42-43
	hexbytes[42] = 'b6';
	hexbytes[43] = 'ec';
	
	// Author's character: bytes 44-63
	hexbytes = unicodeEncode(author, 44, hexbytes);
	
	// Unknown purpose: bytes 64-65
	hexbytes[64] = '44';
	hexbytes[65] = 'c5';
	
	// Author's town name: bytes 66-85
	hexbytes = unicodeEncode(townName, 66, hexbytes);

	// Unknown purpose: bytes 86-87
	hexbytes[86] = '19';
	hexbytes[87] = '31';

	// Palette: bytes 88-102
	for (let i = 0; i < palette.length; i++)
	{
		let decval = palette[i];
		let paletteDechex = '';

		// Unknown math to figure out hex of palette
		if (decval >= 144)
		{
			paletteDechex = dechex(decval - 144) + 'f';
		}
		else
		{
			paletteDechex = dechex(Math.floor(decval / 9)) + dechex(decval % 9);
		}

		hexbytes[i+88] = paletteDechex;
	}

	// Unknown purpose: byte 103-104
	hexbytes[103] = 'cc';
	hexbytes[104] = '0a';
	
	// Pattern type: byte 105
	hexbytes[105] = '09'; // only support normal for now
	
	// Null: bytes 106-107
	// Already set to '00', so do nothing
	
	// Data: bytes 108-585

	// convert data (array of color indexes) to 2D array of palette indexes
	let formData = [];

	for (let i = 0; i < constants.pattern.paletteLength; i++)
	{
		formData[i] = [];
	}

	for (let i = 0; i < constants.pattern.length; i++)
	{
		let x = i % constants.pattern.paletteLength;
		let y = Math.floor(i / constants.pattern.paletteLength);

		formData[y][x] = palette.indexOf(data[i]);
	}

	// go column by column, swap the hex values order and update QR code data
	let index = 108;

	for (let y = 0;  y < constants.pattern.paletteLength; y++)
	{
		for (let x = 0; x < constants.pattern.paletteLength; x += 2)
		{
			hexbytes[index] = dechex(formData[x+1][y]) + dechex(formData[x][y]);
			index++;
		}
	}

	// use QR code generator to generate QR code
	try
	{
		return await QRCode.toDataURL([{
			data: Buffer.from(hexbytes.map(hex => parseInt(hex, 16))),
			mode: 'byte'
		}]);
	}
	catch (e)
	{
		// we don't want to stop the pattern from being created if QR code fails
		console.error(e);
	}

	return null;
}

/*
 * Whether the pattern can make a QR code.
 *
 * parameters:
 * 	gameId - number - the game id used for the pattern
 * 	data - array - the pattern's colors
 * 	colors - array - current game colors
 * 	nlColors - array - NL & QR Code colors
 */
function canCreateQRCode(gameId, data, colors, nlColors)
{
	// QR codes are made with NL colors, so if NL palette we're good
	if (gameId === constants.gameIds.ACNL)
	{
		return true;
	}

	// check if all colors used are found in NL
	// if so, we can also create a QR code
	let includedColors = [];

	outerLoop: for (let i = 0; i < data.length; i++)
	{
		// if using transparent color, immediate disqualification
		if (Number(data[i]) === constants.pattern.transparentColorId)
		{
			return false;
		}

		let rgb = colors[data[i]];

		// only need to check colors we haven't checked yet
		if (!includedColors.includes(rgb))
		{
			includedColors.push(rgb);
		}
		else
		{
			continue;
		}

		// check if any of the QR Code colors matches
		for (let x = 0; x < nlColors.length; x++)
		{
			let rgb2 = nlColors[x];

			// if 90% match; seems to be best after trial & error
			if (hexColorDelta(rgb, rgb2) > 0.90)
			{
				continue outerLoop;
			}
		}

		// if none of them matched, then the pattern is disqualified
		return false;
	}

	// data is always not empty, so if we got this far it's good
	return true;
}

/*
 * Check how much one color code matches another.
 */
function hexColorDelta(hex1, hex2)
{
	hex1 = hex1.substr(1);
	hex2 = hex2.substr(1);

	// get red/green/blue int values of hex1
	var r1 = parseInt(hex1.substring(0, 2), 16);
	var g1 = parseInt(hex1.substring(2, 4), 16);
	var b1 = parseInt(hex1.substring(4, 6), 16);

	// get red/green/blue int values of hex2
	var r2 = parseInt(hex2.substring(0, 2), 16);
	var g2 = parseInt(hex2.substring(2, 4), 16);
	var b2 = parseInt(hex2.substring(4, 6), 16);

	// calculate differences between reds, greens and blues
	var r = 255 - Math.abs(r1 - r2);
	var g = 255 - Math.abs(g1 - g2);
	var b = 255 - Math.abs(b1 - b2);

	// limit differences between 0 and 1
	r /= 255;
	g /= 255;
	b /= 255;

	// 0 means opposite colors, 1 means same colors
	return (r + g + b) / 3;
}

/*
 * Converts string to hex, then updates the QR code array data.
 */
function unicodeEncode(string, offset, hexbytes)
{
	let index = offset;

	// for each character in string
	for (let i = 0; i < string.length; i++)
	{
		// converts i character to decimal to hexadecimal and
		// pads the number with zeros to equal 4 digits
		let ord = dechex(string.charCodeAt(i)).padStart(4, '0');

		// swap the first two with the last two; Nintendo does this for 'security'
		hexbytes[index] = ord.substr(2, 2);
		index++;
		hexbytes[index] = ord.substr(0, 2);
		index++;
	}

	return hexbytes;
}

/*
 * Converts decimal to hexadecimal. Named after php function.
 */
function dechex(number)
{
	return number.toString(16);
}

save.apiTypes = {
	id: {
		type: APITypes.patternId,
		nullable: true,
	},
	patternName: {
		type: APITypes.string,
		required: true,
		error: 'missing-pattern-name',
		length: constants.pattern.patternNameLength,
		profanity: true,
	},
	published: {
		type: APITypes.boolean,
		default: 'false',
	},
	designId: {
		type: APITypes.regex,
		regex: constants.regexes.designId,
	},
	data: {
		type: APITypes.array,
	},
	dataUrl: {
		type: APITypes.string,
		required: true,
	},
	gamePaletteId: {
		type: APITypes.string,
	},
	palette: {
		type: APITypes.array,
	},
	townId: {
		type: APITypes.townId,
		nullable: true,
	},
}

export default save;