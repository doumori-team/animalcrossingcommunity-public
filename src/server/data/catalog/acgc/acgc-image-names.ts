/*
 * Maps AC:GC catalog item names to their image filenames.
 * Images are served from ${constants.AWS_URL}/images/games/gc/catalog/
 *
 * The filename convention uses a series prefix + underscore-separated item name.
 * Special cases are handled via explicit mappings for items with apostrophes,
 * periods, uppercase names, or other irregularities.
 */

import { constants } from '@utils';

const seriesPrefix: Record<string, string> = {
	'Apple Set': 'apple',
	'Arranged Flowers': 'arrrs',
	'Backyard Theme': 'bacrd',
	'Bear Set': 'bear',
	'Blue Series': 'blue',
	'Bonsai Set': 'bonai',
	'Bonsai Trees': 'bones',
	'Boxing Theme': 'boxng',
	'Cabana Series': 'cabna',
	'Cabin Series': 'cabin',
	'Cactus Set': 'cacus',
	'Chairs and Sofas': 'chaas',
	'Chess Theme': 'chess',
	'Citrus Set': 'citus',
	'Classic NES Games': 'claes',
	'Classic Series': 'claic',
	'Clocks': 'cloks',
	'Construction Theme': 'conon',
	'Drum Set': 'drum',
	'Exotic Series': 'exoic',
	'Figurine Set': 'figne',
	'Frog Set': 'frog',
	'Golf Bags': 'golgs',
	'Green Series': 'green',
	'Guitar Set': 'guirs',
	'Harvest Series': 'harst',
	'Holiday Items': 'holay',
	'House Plants': 'houts',
	'Household Items': 'hould',
	'Iris Flower Set': 'irier',
	'Island Items': 'islnd',
	'Jingle Series': 'jinle',
	'Journals and Diaries': 'joues',
	'Kiddie Series': 'kidie',
	'Lovely Series': 'lovly',
	'Lucky Nintendo Set': 'lucdo',
	'Melon Set': 'melo',
	'Mementos and Models': 'memls',
	'Modern Series': 'modrn',
	'Mossy Garden Theme': 'mosen',
	'Musical Instruments': 'musts',
	'Nintendo Set': 'nindo',
	'Office Set': 'offce',
	'Paintings': 'paigs',
	'Pear Set': 'pear',
	'Pine Wood Set': 'pinod',
	'Ranch Series': 'ranch',
	'Red Flower Set': 'reder',
	'Regal Series': 'regal',
	'Robot Set': 'robot',
	'Rock Garden': 'rocen',
	'School Theme': 'schol',
	'Snowman Series': 'snoan',
	'Space Theme': 'space',
	'Spooky Series': 'spoky',
	'Stereo Systems': 'stems',
	'String Instrument Set': 'strnt',
	'Study Set': 'study',
	'Totem Pole Set': 'totle',
	'Vase Set': 'vase',
	'Vending Machine Set': 'venes',
	'Western Theme': 'wesrn',
	'World Icons': 'worns',
	'Yellow Flower Set': 'yell',
};

// Items whose filenames don't follow the standard prefix + normalized-name pattern.
// null = no image exists for this item.
const specialMappings: Record<string, string | null> = {
	// Classic NES Games (uppercase/special names)
	'Balloon Fight': 'claes_balloon_fight',
	'Baseball': 'claes_baseball',
	'Clu Clu Land': 'claes_clu_clu_land',
	'Clu Clu Land D': 'claes_clu_clu_land_d',
	'DK Jr MATH': 'claes_dk_jr_math',
	'Donkey Kong': 'claes_donkey_kong',
	'Donkey Kong 3': 'claes_donkey_kong_3',
	'Donkey Kong Jr': 'claes_donkey_kong_jr',
	'Excitebike': 'claes_excitebike',
	'Golf': 'claes_golf',
	'NES': 'claes_nes_console',
	'Pinball': 'claes_pinball',
	'Punchout': 'claes_punchout',
	'Soccer': 'claes_soccer',
	'Tennis': 'claes_tennis',
	"Wario's Woods": 'claes_warios_woods',
	'Ice Climber': null,
	'Legend of Zelda': null,
	'Mario Bros.': null,
	'Super Mario Bros.': null,

	// Mario Items (no images)
	'? Block': null,
	'brick block': null,
	'cannon': null,
	'coin': null,
	'fire flower': null,
	'flagpole': null,
	'green pipe': null,
	'koopa shell': null,
	'starman': null,
	'super mushroom': null,

	// Apostrophe items
	"barber's pole": 'hould_barbers_pole',
	"judge's bell": 'boxng_judges_bell',
	"Nook's portrait": 'hould_nooks_portrait',
	"teacher's chair": 'schol_teachers_chair',
	"teacher's desk": 'schol_teachers_desk',
	"captain's log": 'joues_captains_log',
	"Katrina's tent": 'memls_katrinas_tent',
	"Gracie's top": 'gracies_top',
	"Anju's shirt": 'anjus_shirt',
	"Kaffe's shirt": 'kaffes_shirt',
	"big bro's shirt": 'big_bros_shirt',
	"li'l bro's shirt": 'lil_bros_shirt',
	"painter's smock": 'painters_smock',
	"Saharah's desert": 'saharahs_desert',
	"new year's card": 'new_years_card',
	"jack-o'-lantern": 'holay_jack-o-lantern',

	// Hyphenated / special char items
	'glass-top table': 'hould_glass-top_table',
	'wide-screen TV': 'hould_wide-screen_tv',
	'flip-top desk': 'schol_flip-top_desk',
	'jack-in-the-box': 'holay_jack-in-the-box',
	'haz-mat barrel': 'conon_haz-mat_barrel',
	'hi-fi stereo': 'stems_hi-fi_stereo',
	'high-end stereo': 'stems_high-end_stereo',
	'reel-to-reel': 'stems_reel-to-reel',
	'blue-trim wall': 'blue-trim_wall',
	'tree-lined wall': 'tree-lined_wall',
	'polka-dot paper': 'polka-dot_paper',

	// Period items
	'Mrs. Flamingo': 'bacrd_mrs_flamingo',
	'Mr. Flamingo': 'bacrd_mr_flamingo',
	'No.1 shirt': 'no1_shirt',
	'No.2 shirt': 'no2_shirt',
	'No.3 shirt': 'no3_shirt',
	'No.4 shirt': 'no4_shirt',
	'No.5 shirt': 'no5_shirt',
	'No.23 shirt': 'no23_shirt',
	'No.67 shirt': 'no67_shirt',
	'Bunny P. balloon': 'bunny_p_balloon',
	'Bunny B. balloon': 'bunny_b_balloon',
	'Bunny O. balloon': 'bunny_o_balloon',

	// Uppercase / capitalized names
	'Diver Dan': 'islnd_diver_dan',
	'Spaceman Sam': 'space_spaceman_sam',
	'Super Tortimer': 'memls_super_tortimer',
	'Snowman': 'memls_snowman',
	'CD player': 'stems_cd_player',
	'A shirt': 'a_shirt',
	'BB shirt': 'bb_shirt',
	'G logo': 'nindo_g_logo',
	'N logo': 'nindo_n_logo',
	'G logo shirt': 'g_logo_shirt',
	'MVP shirt': 'mvp_shirt',
	'U R here shirt': 'u_r_here_shirt',
	'Arwing': 'nindo_arwing',
	'Master Sword': 'nindo_master_sword',
	'Arc De Triomphe': 'worns_arc_de_triomphe',
	'Chinese lion': 'worns_chinese_lion',
	'Chinese lioness': 'worns_chinese_lioness',
	'Lady Liberty': 'worns_lady_liberty',
	'Manekin Pis': 'worns_manekin_pis',
	'Merlion': 'worns_merlion',
	'Moai statue': 'worns_moai_statue',
	'Mouth of Truth': 'worns_mouth_of_truth',
	'Tokyo Tower': 'worns_tokyo_tower',
	'Tower of Pisa': 'worns_tower_of_pisa',

	// Bear Set (capitalized)
	'Baby bear': 'bear_baby_bear',
	'Mama bear': 'bear_mama_bear',
	'Papa bear': 'bear_papa_bear',

	// Figurine Set (capitalized)
	'Aiko figurine': 'figne_aiko_figurine',
	'Emi figurine': 'figne_emi_figurine',
	'Keiko figurine': 'figne_keiko_figurine',
	'Maki figurine': 'figne_maki_figurine',
	'Naomi figurine': 'figne_naomi_figurine',
	'Yoko figurine': 'figne_yoko_figurine',
	'Yuki figurine': 'figne_yuki_figurine',

	// Lucky Nintendo Set (capitalized)
	'Luigi trophy': 'lucdo_luigi_trophy',
	'Mario trophy': 'lucdo_mario_trophy',

	// Jingle Series (capitalized)
	'Jingle bed': 'jinle_jingle_bed',
	'Jingle chair': 'jinle_jingle_chair',
	'Jingle clock': 'jinle_jingle_clock',
	'Jingle dresser': 'jinle_jingle_dresser',
	'Jingle lamp': 'jinle_jingle_lamp',
	'Jingle piano': 'jinle_jingle_piano',
	'Jingle shelves': 'jinle_jingle_shelves',
	'Jingle sofa': 'jinle_jingle_sofa',
	'Jingle table': 'jinle_jingle_table',
	'Jingle wardrobe': 'jinle_jingle_wardrobe',
	'Jingle shirt': 'jingle_shirt',
	'Jingle wall': 'jingle_wall',
	'Jingle carpet': 'jingle_carpet',

	// Snowman Series (capitalized)
	'Snowman bed': 'snoan_snowman_bed',
	'Snowman chair': 'snoan_snowman_chair',
	'Snowman clock': null, // missing from image set
	'Snowman dresser': 'snoan_snowman_dresser',
	'Snowman fridge': 'snoan_snowman_fridge',
	'Snowman lamp': 'snoan_snowman_lamp',
	'Snowman sofa': 'snoan_snowman_sofa',
	'Snowman table': 'snoan_snowman_table',
	'Snowman TV': 'snoan_snowman_tv',
	'Snowman wardrobe': 'snoan_snowman_wardrobe',
	'Snowman wall': 'snowman_wall',
	'Snowman carpet': 'snowman_carpet',

	// Misc special cases
	'bass': 'strnt_bass_(instrument)',
	'café shirt': 'cafe_shirt',
	'gaudy sweater': 'caudy_sweater', // typo in original filename
	'globe': 'study_globe',
	'writing chair': 'study_writing_chair',
	'writing desk': 'study_writing_desk',
	'harvest TV': 'harst_harvest_tv',
	'retro TV': 'hould_retro_tv',
	'apple TV': 'apple_apple_tv',
	'parchment': 'parchment',
	'shirt circuit': 'shirt_circuit',

	'block flooring': null,
	'bamboo robe': null,
	'blue puffy vest': null,
	'blue sweatsuit': null,
	'plum kimono': null,
	'red puffy vest': null,
	'red sweatsuit': null,
	'somber robe': null,
	'summer robe': null,
	'mushroom mural': null,

	// Creatures
	'flat stag beetle': 'flat_stagbeetle',
	'longheaded locust': 'long_locust',
};

function normalizeName(name: string): string
{
	return name
		.toLowerCase()
		.replace(/'/g, '')
		.replace(/\./g, '')
		.replace(/\?/g, '')
		.replace(/é/g, 'e')
		.replace(/ /g, '_');
}

export function getAcgcImageName(itemName: string, series: string, sourceSheet: string): string | null
{
	if (sourceSheet === 'Music' || sourceSheet === 'Miscellaneous')
	{
		return null;
	}

	const directory = `${constants.AWS_URL}/images/games/gc/catalog/`;

	if (sourceSheet === 'Fish' && itemName === 'bass')
	{
		// continue
	}
	else if (itemName in specialMappings)
	{
		return specialMappings[itemName] !== null ? `${directory}${specialMappings[itemName]}.jpg` : null;
	}

	const prefix = seriesPrefix[series];
	const norm = normalizeName(itemName);

	if (prefix !== undefined)
	{
		return `${directory}${prefix}_${norm}.jpg`;
	}

	return `${directory}${norm}.jpg`;
}
