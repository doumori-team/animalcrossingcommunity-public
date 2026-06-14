/*
 * Maps AC:CF catalog item names to their image filenames.
 */

import { constants } from '@utils';

// Items whose filenames don't follow the standard pattern.
const specialMappings: Record<string, string | null> = {
	// Bugs
	'peacock butterfly': 'Peacock_CF_Model.png',
	'monarch butterfly': 'Monarch_CF_Model.png',
	'emperor butterfly': 'Emperor_CF_Model.png',
	'ladybug (ladybird)': 'Ladybug_CF_Model.png',

	// DLC
	'blue school cap': null,
	'bonbori lamp / blossom lamp': null,
	'bridal veil / tsunokakushi': null,
	'bus model / model bus': null,
	'carp banner / koinobori': null,
	'celebration vest': null,
	'dirndl dress': null,
	'eggplant cow / aubergine cow': null,
	'flamenco dress': null,
	'GameCube dresser / GameCube chest': null,
	'ginsing chicken soup / samgyetang': null,
	'girl\'s day updo / empress\' tiara': null,
	'golden drawer': null,
	'golden floor (pattern)': null,
	'golden king': null,
	'golden sofa': null,
	'golden wall (pattern)': null,
	'golden warrior': null,
	'guard\'s pattern': null,
	'hanbok (pattern)': null,
	'hangul t-shirt (pattern)': null,
	'kintarou apron': null,
	'kintarou wig': null,
	'ladder shades / shutter shades': null,
	'mayor\'s flag': null,
	'Mushroom rack / mush hanger': null,
	'Nintendo DSi bench (black)': null,
	'Nintendo DSi bench (white)': null,
	'nintendog - chihuahua': null,
	'nintendog - dachshund': null,
	'nintendog - dalmatian': null,
	'nintendog - labrador': null,
	'red team cap': null,
	'red-horned hat': null,
	'sandcastle': null,
	'school uniform': null,
	'snowman head hat': null,
	'student cap / gakuseibou': null,
	'sweets stereo': null,
	'tam o\'shanter': null,
	'victory korea t-shirt (pattern)': null,

	// Flowers
	'sun cosmos': 'Yellow_Cosmos_CF_Model.png',
	'white pansy': 'White_Pansies_CF_Model.png',
	'white rose': 'White_Roses_CF_Model.png',
	'white tulip': 'White_Tulips_CF_Model.png',
	'yellow pansy': 'Yellow_Pansies_CF_Model.png',
	'yellow rose': 'Yellow_Roses_CF_Model.png',
	'yellow tulip': 'Yellow_Tulips_CF_Model.png',
	'black rose': 'Black_Roses_CF_Model.png',
	'black tulip': 'Black_Tulips_CF_Model.png',
	'blue pansy': 'Blue_Pansies_CF_Model.png',
	'blue rose': 'Blue_Roses_CF_Model.png',
	'dandelion puff': 'Dandelion_Puffs_CF_Model.png',
	'dandelion': 'Dandelions_CF_Model.png',
	'gold rose': 'Gold_Roses_CF_Model.png',
	'orange pansy': 'Orange_Pansies_CF_Model.png',
	'orange rose': 'Orange_Roses_CF_Model.png',
	'pink tulip': 'Pink_Tulips_CF_Model.png',
	'purple pansy': 'Purple_Pansies_CF_Model.png',
	'purple rose': 'Purple_Roses_CF_Model.png',
	'purple tulip': 'Purple_Tulips_CF_Model.png',
	'red pansy': 'Red_Pansies_CF_Model.png',
	'red rose': 'Red_Roses_CF_Model.png',
	'red tulip': 'Red_Tulips_CF_Model.png',
	'pink rose': 'Pink_Roses_CF_Model.png',

	// Furniture
	'speedbag': 'Speed_Bag_CF_Model.png',
	'raccoon figurine': null,
	'samurai suit': 'Samurai_Suit_(Clothes)_CF_Model.png',
	'sweets mini table': 'Sweets_Minitable_CF_Model.png',
	'sweets mini lamp': 'Sweets_Minilamp_CF_Model.png',
	'bubble wand': 'Bubble_Wand_CF_Icon.png',

	// Headgear / Clothing
	'bad bro \'stache': 'Bad_Bro_Stache_CF_Model.png',
	'A shirt': 'A_Shirt_CF_Model.png',

	// Misc
	'white turnip': 'Turnip_CF_Icon.png',
	'party popper': 'Party_Popper_CF_Icon.png',
	'Roman candle': 'Roman_Candle_CF_Icon.png',
	'sparkler': null,
	'blue candy': 'Blue_Candy_CF_Icon.png',
	'empty lamp': 'Magic_Lamp_CF_Model.png',
	'forged painting': null,
	'green candy': 'Green_Candy_CF_Icon.png',
	'knife and fork': 'Knife_and_Fork_CF_Icon.png',
	'paint': null,
	'pitfall': 'Pitfall_Seed_CF_Model.png',
	'red candy': 'Red_Candy_CF_Icon.png',
	'yellow candy': 'Yellow_Candy_CF_Icon.png',

	// Wallpaper
	'dirt clod wall': 'Dirt-Clod_Wall_CF_Texture.png',
};

const noImageSourceSheets = new Set([
	'K.K. Slider Songs',
	'Stationery',
]);

const smallWords = new Set(['of', 'a', 'de', 'with', 'in', 'the', 'to']);

const suffixMap: Record<string, string> = {
	'Wallpaper': '_CF_Texture.png',
	'Carpet': '_CF_Texture.png',
};

function normalizeString(str: string): string
{
	return str
		.replace(/\?/g, 'question')
		.replace(/&/g, '6')
		.replace(/é/g, 'e')
		.replace(/'/g, '7')
		.replace(/’/g, '7');
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

export function getAccfImageName(itemName: string, sourceSheet: string): string | null
{
	if (noImageSourceSheets.has(sourceSheet))
	{
		return null;
	}

	const directory = `${constants.AWS_URL}/images/games/cf/catalog/`;

	if (itemName in specialMappings)
	{
		const mapped = specialMappings[itemName];

		return mapped !== null ? `${directory}${mapped}` : null;
	}

	let base = normalizeString(titleCaseName(itemName));

	if (itemName.startsWith("New Year's shirt"))
	{
		const year = itemName.split(' ').pop();
		base = `New_Year's_Shirt_(${year})`;
	}

	const suffix = suffixMap[sourceSheet] || '_CF_Model.png';

	return `${directory}${base}${suffix}`;
}
