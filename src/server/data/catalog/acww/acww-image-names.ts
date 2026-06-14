/*
 * Maps AC:WW catalog item names to their image filenames.
 *
 * The filename convention is Title_Case_Name + suffix:
 *   - Wallpaper / Carpet: _WW_Texture.png
 *   - Bugs / Fish:        _WW_Sprite.png
 *   - Tools & Gadgets:    _WW_Inv_Icon.png
 *   - Everything else:    _WW_Model.png
 *
 * Title-casing rules:
 *   - Each word and each hyphen-segment is capitalized
 *   - Small words (of, a, de, with, in, the, to) stay lowercase
 *   - Acronyms (TV, VCR) stay uppercase
 *   - Slashes become hyphens (washer/dryer → Washer-Dryer)
 *   - Apostrophes are preserved as-is
 */
import { constants } from '@utils';

// Items whose filenames don't follow the standard pattern.
const specialMappings: Record<string, string | null> = {
	// Furniture / Clothing
	'A shirt': 'A_Shirt_WW_Model.png',
	'poncho': 'Poncho_(Item)_WW_Model.png',

	// Stationery
	'Nook paper': 'Nook_Paper_WW_Texture.png',
	'bottle paper': null,

	// Bugs
	'peacock butterfly': 'Peacock_WW_Sprite.png',
	'monarch butterfly': 'Monarch_WW_Sprite.png',
	'emperor butterfly': 'Emperor_WW_Sprite.png',
	'birdwing butterfly': 'Birdwing_WW_Sprite.png',
	'pillbug': 'Pill_Bug_WW_Sprite.png',

	// Tools
	'sparkler': 'Roman_Candle_WW_Inv_Icon.png',

	// Pictures
	'Kaitlin & Katie\'s pic': 'K_and_K7s_Pic_WW_Model.png',
	'Poppy\'s pic': null,
	'Tom\'s pic': null,
	'Tutu\'s pic': null,
	'Vladimir\'s pic': null,

	// Carpet / Floors
	'music-room floor': 'Music_Room_Floor_WW_Texture.png',
	'music-room wall': 'Music_Room_Wall_WW_Texture.png',

	// Tree & Flowers
	'cedar sapling': 'Cedar_Sapling_WW_Sprite.png',
	'sapling': 'Sapling_WW_Sprite.png',
	'lucky clovers': null,
	'yellow cosmos': 'Sun_Cosmos_WW_Model.png',
	'party popper': 'Party_Popper_WW_Sprite.png',
	'Roman candle': 'Roman_Candle_WW_Sprite.png',
};

const noImageSourceSheets = new Set([
	'Music',
]);

const smallWords = new Set(['of', 'a', 'de', 'with', 'in', 'the', 'to']);

const suffixMap: Record<string, string> = {
	'Wallpaper': '_WW_Texture.png',
	'Carpet': '_WW_Texture.png',
	'Bugs': '_WW_Sprite.png',
	'Fish': '_WW_Sprite.png',
	'Tools & Gadgets': '_WW_Inv_Icon.png',
	'Fruit': '_WW_Sprite.png',
};

function normalizeString(str: string): string
{
	return str
		.replace(/\?/g, 'question')
		.replace(/&/g, '6')
		.replace(/'/g, '7');
}

function titleCaseName(name: string): string
{
	// Slashes become hyphens
	const cleaned = name.replace(/\//g, '-');

	return cleaned.split(' ').map((word) =>
	{
		if (word === word.toUpperCase() && word.length > 1)
		{
			return word; // preserve acronyms like TV, VCR
		}

		if (word.includes('-'))
		{
			return word.split('-').map((seg) =>
			{
				if (seg === seg.toUpperCase() && seg.length > 1)
				{
					return seg;
				}

				if (smallWords.has(seg.toLowerCase()))
				{
					return seg.toLowerCase();
				}

				return seg.charAt(0).toUpperCase() + seg.slice(1);
			}).join('-');
		}

		if (smallWords.has(word.toLowerCase()))
		{
			return word.toLowerCase();
		}

		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join('_');
}

export function getAcwwImageName(itemName: string, sourceSheet: string): string | null
{
	if (noImageSourceSheets.has(sourceSheet))
	{
		return null;
	}

	const directory = `${constants.AWS_URL}/images/games/ww/catalog/`;

	if (itemName in specialMappings)
	{
		const mapped = specialMappings[itemName];

		return mapped !== null ? `${directory}${mapped}` : null;
	}

	const base = normalizeString(titleCaseName(itemName));
	const suffix = suffixMap[sourceSheet] || '_WW_Model.png';

	return `${directory}${base}${suffix}`;
}
