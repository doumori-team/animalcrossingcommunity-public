/*
 * Maps AC:NH catalog item names to their image filenames.
 * Images are served from ${constants.AWS_URL}/images/games/nh/*
 */

import { constants, utils } from '@utils';

// Items whose filenames don't follow the standard normalized-name pattern.
// Value = exact filename in the catalog directory.
// null = no image exists for this item.
const specialMappings: Record<string, string | null> = {
	'K.K. D&B': 'kk/storage/kk_db.png',

	// Other category
	'acorn': 'materials/storage/acorn.png',
	'apple': 'produce/storage/apple.png',
	'apple tree': 'flora/gardening/fruit_oak_tree_day_4-apple.png',
	'Aquarius fragment': 'materials/storage/aquarius_fragment.png',
	'Aries fragment': 'materials/storage/aries_fragment.png',
	'bamboo piece': 'materials/storage/bamboo_piece.png',
	'bamboo shoot': 'produce/storage/bamboo_shoot.png',
	'bamboo tree': 'flora/gardening/bamboo_day_4.png',
	'black cosmos': 'flora/storage/black_cosmos.png',
	'black lilies': 'flora/storage/black_lilies.png',
	'black roses': 'flora/storage/black_roses.png',
	'black tulips': 'flora/storage/black_tulips.png',
	'black wrapping paper': 'other/storage/black_wrapping_paper.png',
	'black-cosmos plant': 'flora/gardening/cosmos_day_3-black.png',
	'black-lily plant': 'flora/gardening/lily_day_3-black.png',
	'black-rose plant': 'flora/gardening/rose_day_3-black.png',
	'black-tulip plant': 'flora/gardening/tulip_day_3-black.png',
	'blue feather': 'other/storage/blue_feather.png',
	'blue hyacinths': 'flora/storage/blue_hyacinths.png',
	'blue ornament': 'materials/storage/blue_ornament.png',
	'blue pansies': 'flora/storage/blue_pansies.png',
	'blue roses': 'flora/storage/blue_roses.png',
	'blue windflowers': 'flora/storage/blue_windflowers.png',
	'blue wrapping paper': 'other/storage/blue_wrapping_paper.png',
	'blue-hyacinth plant': 'flora/gardening/hyacinth_day_3-blue.png',
	'blue-hydrangea bush': 'flora/gardening/hydrangea_bush_day_2-blue.png',
	'blue-hydrangea start': 'flora/icons/blue-hydrangea_start.png',
	'blue-pansy plant': 'flora/gardening/pansy_day_3-blue.png',
	'blue-rose plant': 'flora/gardening/rose_day_3-blue.png',
	'blue-windflower plant': 'flora/gardening/windflower_day_3-blue.png',
	'bokjumeoni lucky pouch': 'other/storage/bokjumeoni_lucky_pouch.png',
	'brown sugar': 'materials/storage/brown_sugar.png',
	'brown wrapping paper': 'other/storage/brown_wrapping_paper.png',
	'Cancer fragment': 'materials/storage/cancer_fragment.png',
	'candy': 'other/storage/candy.png',
	'Capricorn fragment': 'materials/storage/capricorn_fragment.png',
	'carrot': 'produce/storage/carrot.png',
	'carrot start': 'flora/icons/carrot_start.png',
	'cedar sapling': 'flora/storage/cedar_sapling.png',
	'cedar tree': 'flora/gardening/cedar_tree_day_4.png',
	'chartreuse wrapping paper': 'other/storage/chartreuse_wrapping_paper.png',
	'cherry': 'produce/storage/cherry.png',
	'cherry tree': 'flora/gardening/fruit_oak_tree_day_4-cherry.png',
	'cherry-blossom petal': 'materials/storage/cherry-blossom_petal.png',
	'clay': 'materials/storage/clay.png',
	'clump of weeds': 'flora/storage/clump_of_weeds.png',
	'coconut': 'produce/storage/coconut.png',
	'coconut tree': 'flora/gardening/palm_tree_day_4.png',
	'conch': 'other/icons/conch.png',
	'coral': 'other/icons/coral.png',
	'cowrie': 'other/icons/cowrie.png',
	'customizable phone case kit': 'other/storage/customizable_phone_case_kit.png',
	'customization kit': 'other/storage/customization_kit.png',
	'earth egg': 'materials/storage/earth_egg.png',
	'elegant mushroom': 'materials/storage/elegant_mushroom.png',
	'festive wrapping paper': 'other/storage/festive_wrapping_paper.png',
	'fish bait': 'other/storage/fish_bait.png',
	'flat mushroom': 'materials/storage/flat_mushroom.png',
	'flour': 'materials/storage/flour.png',
	'fountain firework': 'other/storage/fountain_firework.png',
	'Gemini fragment': 'materials/storage/gemini_fragment.png',
	'giant clam': 'other/icons/giant_clam.png',
	'glowing moss': 'flora/storage/glowing_moss.png',
	'gold nugget': 'materials/storage/gold_nugget.png',
	'gold ornament': 'materials/storage/gold_ornament.png',
	'gold roses': 'flora/storage/gold_roses.png',
	'gold wrapping paper': 'other/storage/gold_wrapping_paper.png',
	'gold-rose plant': 'flora/gardening/rose_day_3-gold.png',
	'gray wrapping paper': 'other/storage/gray_wrapping_paper.png',
	'green feather': 'other/storage/green_feather.png',
	'green mums': 'flora/storage/green_mums.png',
	'green pumpkin': 'produce/storage/green_pumpkin.png',
	'green wrapping paper': 'other/storage/green_wrapping_paper.png',
	'green-mum plant': 'flora/gardening/mum_day_3-green.png',
	'hardwood': 'materials/storage/hardwood.png',
	'hardwood tree': 'flora/gardening/fruit_oak_tree_day_4-oak.png',
	'heart crystal': 'other/storage/heart_crystal.png',
	'holly bush': 'flora/gardening/holly_bush_day_2.png',
	'holly start': 'flora/icons/holly_start.png',
	'iron nugget': 'materials/storage/iron_nugget.png',
	'large snowflake': 'materials/storage/large_snowflake.png',
	'large star fragment': 'materials/storage/large_star_fragment.png',
	'leaf egg': 'materials/storage/leaf_egg.png',
	'Leo fragment': 'materials/storage/leo_fragment.png',
	'Libra fragment': 'materials/storage/libra_fragment.png',
	'light-blue wrapping paper': 'other/storage/light-blue_wrapping_paper.png',
	'lily-of-the-valley plant': 'flora/gardening/lily_of_the_valley.png',
	'lollipop': 'other/storage/lollipop.png',
	'lucky red envelope': 'other/storage/lucky_red_envelope.png',
	'manila clam': 'other/icons/manila_clam.png',
	'maple leaf': 'materials/storage/maple_leaf.png',
	'medicine': 'other/storage/medicine.png',
	'mint wrapping paper': 'other/storage/mint_wrapping_paper.png',
	'money tree': 'flora/gardening/fruit_oak_tree_day_4-money.png',
	'navy wrapping paper': 'other/storage/navy_wrapping_paper.png',
	'orange': 'produce/storage/orange.png',
	'orange cosmos': 'flora/storage/orange_cosmos.png',
	'orange hyacinths': 'flora/storage/orange_hyacinths.png',
	'orange lilies': 'flora/storage/orange_lilies.png',
	'orange pansies': 'flora/storage/orange_pansies.png',
	'orange pumpkin': 'produce/storage/orange_pumpkin.png',
	'orange roses': 'flora/storage/orange_roses.png',
	'orange tree': 'flora/gardening/fruit_oak_tree_day_4-orange.png',
	'orange tulips': 'flora/storage/orange_tulips.png',
	'orange windflowers': 'flora/storage/orange_windflowers.png',
	'orange wrapping paper': 'other/storage/orange_wrapping_paper.png',
	'orange-cosmos plant': 'flora/gardening/cosmos_day_3-orange.png',
	'orange-hyacinth plant': 'flora/gardening/hyacinth_day_3-orange.png',
	'orange-lily plant': 'flora/gardening/lily_day_3-orange.png',
	'orange-pansy plant': 'flora/gardening/pansy_day_3-orange.png',
	'orange-rose plant': 'flora/gardening/rose_day_3-orange.png',
	'orange-tea-olive bush': 'flora/gardening/tea-olive_bush_day_2-orange.png',
	'orange-tea-olive start': 'flora/icons/orange-tea-olive_start.png',
	'orange-tulip plant': 'flora/gardening/tulip_day_3-orange.png',
	'orange-windflower bag': 'flora/storage/flower_seed.png',
	'orange-windflower plant': 'flora/gardening/windflower_day_3-orange.png',
	'otoshidama envelope': 'other/storage/otoshidama_envelope.png',
	'Paradise Planning case': 'other/storage/paradise_planning_case.png',
	'peach': 'produce/storage/peach.png',
	'peach tree': 'flora/gardening/fruit_oak_tree_day_4-peach.png',
	'pear': 'produce/storage/pear.png',
	'pear tree': 'flora/gardening/fruit_oak_tree_day_4-pear.png',
	'pearl': 'materials/storage/pearl.png',
	'pine cone': 'materials/storage/pine_cone.png',
	'pink cosmos': 'flora/storage/pink_cosmos.png',
	'pink hyacinths': 'flora/storage/pink_hyacinths.png',
	'pink lilies': 'flora/storage/pink_lilies.png',
	'pink mums': 'flora/storage/pink_mums.png',
	'pink roses': 'flora/storage/pink_roses.png',
	'pink tulips': 'flora/storage/pink_tulips.png',
	'pink windflowers': 'flora/storage/pink_windflowers.png',
	'pink wrapping paper': 'other/storage/pink_wrapping_paper.png',
	'pink-azalea bush': 'flora/gardening/azalea_bush_day_2-pink.png',
	'pink-azalea start': 'flora/icons/pink-azalea_start.png',
	'pink-camellia bush': 'flora/gardening/camellia_bush_day_2-pink.png',
	'pink-camellia start': 'flora/icons/pink-camellia_start.png',
	'pink-cosmos plant': 'flora/gardening/cosmos_day_3-pink.png',
	'pink-hyacinth plant': 'flora/gardening/hyacinth_day_3-pink.png',
	'pink-hydrangea bush': 'flora/gardening/hydrangea_bush_day_2-pink.png',
	'pink-hydrangea start': 'flora/icons/pink-hydrangea_start.png',
	'pink-lily plant': 'flora/gardening/lily_day_3-pink.png',
	'pink-mum plant': 'flora/gardening/mum_day_3-pink.png',
	'pink-plumeria bush': 'flora/gardening/plumeria_bush_day_2-pink.png',
	'pink-plumeria start': 'flora/icons/pink-plumeria_start.png',
	'pink-rose plant': 'flora/gardening/rose_day_3-pink.png',
	'pink-tulip plant': 'flora/gardening/tulip_day_3-pink.png',
	'pink-windflower plant': 'flora/gardening/windflower_day_3-pink.png',
	'Pisces fragment': 'materials/storage/pisces_fragment.png',
	'pitfall seed': 'other/storage/pitfall_seed.png',
	'Pocket Camp phone case': 'other/storage/pocket_camp_phone_case.png',
	'potato': 'produce/storage/potato.png',
	'pumpkin start': 'flora/icons/pumpkin_start.png',
	'purple feather': 'other/storage/purple_feather.png',
	'purple hyacinths': 'flora/storage/purple_hyacinths.png',
	'purple mums': 'flora/storage/purple_mums.png',
	'purple pansies': 'flora/storage/purple_pansies.png',
	'purple roses': 'flora/storage/purple_roses.png',
	'purple tulips': 'flora/storage/purple_tulips.png',
	'purple windflowers': 'flora/storage/purple_windflowers.png',
	'purple wrapping paper': 'other/storage/purple_wrapping_paper.png',
	'purple-hyacinth plant': 'flora/gardening/hyacinth_day_3-purple.png',
	'purple-mum plant': 'flora/gardening/mum_day_3-purple.png',
	'purple-pansy plant': 'flora/gardening/pansy_day_3-purple.png',
	'purple-rose plant': 'flora/gardening/rose_day_3-purple.png',
	'purple-tulip plant': 'flora/gardening/tulip_day_3-purple.png',
	'purple-windflower plant': 'flora/gardening/windflower_day_3-purple.png',
	'rainbow feather': 'other/storage/rainbow_feather.png',
	'rare mushroom': 'materials/storage/rare_mushroom.png',
	'red cosmos': 'flora/storage/red_cosmos.png',
	'red feather': 'other/storage/red_feather.png',
	'red hyacinths': 'flora/storage/red_hyacinths.png',
	'red lilies': 'flora/storage/red_lilies.png',
	'red mums': 'flora/storage/red_mums.png',
	'red ornament': 'materials/storage/red_ornament.png',
	'red pansies': 'flora/storage/red_pansies.png',
	'red roses': 'flora/storage/red_roses.png',
	'red tulips': 'flora/storage/red_tulips.png',
	'red windflowers': 'flora/storage/red_windflowers.png',
	'red wrapping paper': 'other/storage/red_wrapping_paper.png',
	'red-camellia bush': 'flora/gardening/camellia_bush_day_2-red.png',
	'red-camellia start': 'flora/icons/red-camellia_start.png',
	'red-cosmos bag': 'flora/storage/flower_seed.png',
	'red-cosmos plant': 'flora/gardening/cosmos_day_3-red.png',
	'red-hibiscus bush': 'flora/gardening/hibiscus_bush_day_2-red.png',
	'red-hibiscus start': 'flora/icons/red-hibiscus_start.png',
	'red-hyacinth bag': 'flora/storage/flower_seed.png',
	'red-hyacinth plant': 'flora/gardening/hyacinth_day_3-red.png',
	'red-lily bag': 'flora/storage/flower_seed.png',
	'red-lily plant': 'flora/gardening/lily_day_3-red.png',
	'red-mum bag': 'flora/storage/flower_seed.png',
	'red-mum plant': 'flora/gardening/mum_day_3-red.png',
	'red-pansy bag': 'flora/storage/flower_seed.png',
	'red-pansy plant': 'flora/gardening/pansy_day_3-red.png',
	'red-rose bag': 'flora/storage/flower_seed.png',
	'red-rose plant': 'flora/gardening/rose_day_3-red.png',
	'red-tulip bag': 'flora/storage/flower_seed.png',
	'red-tulip plant': 'flora/gardening/tulip_day_3-red.png',
	'red-windflower bag': 'flora/storage/flower_seed.png',
	'red-windflower plant': 'flora/gardening/windflower_day_3-red.png',
	'ripe carrot plant': 'flora/gardening/carrot_day_3.png',
	'ripe green-pumpkin plant': 'flora/gardening/pumpkin_day_3-green.png',
	'ripe orange-pumpkin plant': 'flora/gardening/pumpkin_day_3-orange.png',
	'ripe potato plant': 'flora/gardening/potato_day_3.png',
	'ripe sugarcane plant': 'flora/gardening/sugarcane_day_3.png',
	'ripe tomato plant': 'flora/gardening/tomato_day_3.png',
	'ripe wheat plant': 'flora/gardening/wheat_day_3.png',
	'ripe white-pumpkin plant': 'flora/gardening/pumpkin_day_3-white.png',
	'ripe yellow-pumpkin plant': 'flora/gardening/pumpkin_day_3-yellow.png',
	'round mushroom': 'materials/storage/round_mushroom.png',
	'Sagittarius fragment': 'materials/storage/sagittarius_fragment.png',
	'Saharah Ticket': 'other/storage/saharah_ticket.png',
	'sand dollar': 'other/icons/sand_dollar.png',
	'sapling': 'flora/storage/sapling.png',
	'Scorpius fragment': 'materials/storage/scorpius_fragment.png',
	'sea snail': 'other/icons/sea_snail.png',
	'seed potato': 'flora/icons/seed_potato.png',
	'skinny mushroom': 'materials/storage/skinny_mushroom.png',
	'sky egg': 'materials/storage/sky_egg.png',
	'snowflake': 'materials/storage/snowflake.png',
	'softwood': 'materials/storage/softwood.png',
	'souvenir chocolates': 'other/storage/souvenir_chocolates.png',
	'star fragment': 'materials/storage/star_fragment.png',
	'stone': 'materials/storage/stone.png',
	'stone egg': 'materials/storage/stone_egg.png',
	'sugar': 'materials/storage/sugar.png',
	'sugarcane': 'produce/storage/sugarcane.png',
	'sugarcane start': 'flora/icons/sugarcane_start.png',
	'summer shell': 'materials/storage/summer_shell.png',
	'Taurus fragment': 'materials/storage/taurus_fragment.png',
	'tomato': 'produce/storage/tomato.png',
	'tomato start': 'flora/icons/tomato_start.png',
	'tree branch': 'materials/storage/tree_branch.png',
	'turnips': 'produce/storage/turnips.png',
	'venus comb': 'other/icons/venus_comb.png',
	'vine': 'flora/storage/vine.png',
	'Virgo fragment': 'materials/storage/virgo_fragment.png',
	'water egg': 'materials/storage/water_egg.png',
	'wheat': 'produce/storage/wheat.png',
	'wheat start': 'flora/icons/wheat_start.png',
	'white cosmos': 'flora/storage/white_cosmos.png',
	'white hyacinths': 'flora/storage/white_hyacinths.png',
	'white lilies': 'flora/storage/white_lilies.png',
	'white mums': 'flora/storage/white_mums.png',
	'white pansies': 'flora/storage/white_pansies.png',
	'white pumpkin': 'produce/storage/white_pumpkin.png',
	'white roses': 'flora/storage/white_roses.png',
	'white tulips': 'flora/storage/white_tulips.png',
	'white windflowers': 'flora/storage/white_windflowers.png',
	'white wrapping paper': 'other/storage/white_wrapping_paper.png',
	'white-azalea bush': 'flora/gardening/azalea_bush_day_2-white.png',
	'white-azalea start': 'flora/icons/white-azalea_start.png',
	'white-cosmos bag': 'flora/storage/flower_seed.png',
	'white-cosmos plant': 'flora/gardening/cosmos_day_3-white.png',
	'white-hyacinth bag': 'flora/storage/flower_seed.png',
	'white-hyacinth plant': 'flora/gardening/hyacinth_day_3-white.png',
	'white-lily bag': 'flora/storage/flower_seed.png',
	'white-lily plant': 'flora/gardening/lily_day_3-white.png',
	'white-mum bag': 'flora/storage/flower_seed.png',
	'white-mum plant': 'flora/gardening/mum_day_3-white.png',
	'white-pansy bag': 'flora/storage/flower_seed.png',
	'white-pansy plant': 'flora/gardening/pansy_day_3-white.png',
	'white-plumeria bush': 'flora/gardening/plumeria_bush_day_2-white.png',
	'white-plumeria start': 'flora/icons/white-plumeria_start.png',
	'white-rose bag': 'flora/storage/flower_seed.png',
	'white-rose plant': 'flora/gardening/rose_day_3-white.png',
	'white-tulip bag': 'flora/storage/flower_seed.png',
	'white-tulip plant': 'flora/gardening/tulip_day_3-white.png',
	'white-windflower bag': 'flora/storage/flower_seed.png',
	'white-windflower plant': 'flora/gardening/windflower_day_3-white.png',
	'whole-wheat flour': 'materials/storage/whole-wheat_flour.png',
	'wood': 'materials/storage/wood.png',
	'wood egg': 'materials/storage/wood_egg.png',
	'yellow cosmos': 'flora/storage/yellow_cosmos.png',
	'yellow hyacinths': 'flora/storage/yellow_hyacinths.png',
	'yellow lilies': 'flora/storage/yellow_lilies.png',
	'yellow mums': 'flora/storage/yellow_mums.png',
	'yellow pansies': 'flora/storage/yellow_pansies.png',
	'yellow pumpkin': 'produce/storage/yellow_pumpkin.png',
	'yellow roses': 'flora/storage/yellow_roses.png',
	'yellow tulips': 'flora/storage/yellow_tulips.png',
	'yellow wrapping paper': 'other/storage/yellow_wrapping_paper.png',
	'yellow-cosmos bag': 'flora/storage/flower_seed.png',
	'yellow-cosmos plant': 'flora/gardening/cosmos_day_3-yellow.png',
	'yellow-hibiscus bush': 'flora/gardening/hibiscus_bush_day_2-yellow.png',
	'yellow-hibiscus start': 'flora/icons/yellow-hibiscus_start.png',
	'yellow-hyacinth bag': 'flora/storage/flower_seed.png',
	'yellow-hyacinth plant': 'flora/gardening/hyacinth_day_3-yellow.png',
	'yellow-lily bag': 'flora/storage/flower_seed.png',
	'yellow-lily plant': 'flora/gardening/lily_day_3-yellow.png',
	'yellow-mum bag': 'flora/storage/flower_seed.png',
	'yellow-mum plant': 'flora/gardening/mum_day_3-yellow.png',
	'yellow-pansy bag': 'flora/storage/flower_seed.png',
	'yellow-pansy plant': 'flora/gardening/pansy_day_3-yellow.png',
	'yellow-rose bag': 'flora/storage/flower_seed.png',
	'yellow-rose plant': 'flora/gardening/rose_day_3-yellow.png',
	'yellow-tea-olive bush': 'flora/gardening/tea-olive_bush_day_2-yellow.png',
	'yellow-tea-olive start': 'flora/icons/yellow-tea-olive_start.png',
	'yellow-tulip bag': 'flora/storage/flower_seed.png',
	'yellow-tulip plant': 'flora/gardening/tulip_day_3-yellow.png',
	'young spring bamboo': 'materials/storage/young_spring_bamboo.png',
};

function normalizeString(str: string): string
{
	return str
		.toLowerCase()
		.replace(/á/g, 'a')
		.replace(/à/g, 'a')
		.replace(/ñ/g, 'n')
		.replace(/â/g, 'a')
		.replace(/'s photo/g, '')
		.replace(/'s poster/g, '')
		.replace(/®/g, '')
		.replace(/'/g, '')
		.replace(/"/g, '')
		.replace(/\./g, '')
		.replace(/\?/g, 'question_mark')
		.replace(/é/g, 'e')
		.replace(/ & /g, '_')
		.replace(/, /g, '_')
		.replace(/ \(/g, '_')
		.replace(/\)/g, '')
		.replace(/×/g, 'x')
		.replace(/→/g, 'right_arrow')
		.replace(/↑/g, 'up_arrow')
		.replace(/←/g, 'left_arrow')
		.replace(/π/g, 'pi')
		.replace(/%/g, '_percent')
		.replace(/ /g, '_');
}

export function getAcnhImageName(itemName: string, sourceSheet: string, genuine: boolean | null, variation: string | null, pattern: string | null, category: string | null): string | null
{
	const directory = `${constants.AWS_URL}/images/games/nh/`;

	let sourceSheetNorm = normalizeString(sourceSheet);

	if (['fish', 'insects', 'sea_creatures'].includes(sourceSheetNorm))
	{
		sourceSheetNorm = 'fauna';
	}
	else if (sourceSheetNorm === 'floors')
	{
		sourceSheetNorm = 'flooring';
	}
	else if (sourceSheetNorm === 'music')
	{
		sourceSheetNorm = 'kk';
	}
	else if (['tools/goods', 'clothing_other'].includes(sourceSheetNorm))
	{
		sourceSheetNorm = 'tools_goods';
	}
	else if (['wall-mounted', 'miscellaneous', 'housewares', 'ceiling_decor', 'interior_structures'].includes(sourceSheetNorm))
	{
		sourceSheetNorm = 'furniture';
	}
	else if (sourceSheetNorm === 'recipes')
	{
		if (category !== null && ['Savory', 'Sweet'].includes(category))
		{
			sourceSheetNorm = 'cooking';
		}
		else
		{
			sourceSheetNorm = 'diy';
		}
	}

	let itemNameNorm = normalizeString(itemName);

	if (sourceSheetNorm === 'posters')
	{
		itemNameNorm = itemNameNorm.replace(/_poster/g, '');
	}

	if (sourceSheetNorm !== 'cooking' && itemName in specialMappings)
	{
		const mapped = specialMappings[itemName];

		return mapped !== null ? `${directory}${mapped}` : null;
	}
	else if (sourceSheetNorm === 'diy' && itemName.startsWith('Turkey Day'))
	{
		itemNameNorm += '-fall_harvest';
	}

	if (genuine !== undefined)
	{
		if (genuine === true)
		{
			return `${directory}${sourceSheetNorm}/${itemNameNorm}_genuine.png`;
		}
		else if (genuine === false)
		{
			return `${directory}${sourceSheetNorm}/${itemNameNorm}_fake.png`;
		}
	}

	if (variation !== null)
	{
		let variationNorm = normalizeString(variation);

		if (utils.realStringLength(variationNorm) > 0)
		{
			itemNameNorm += `-${variationNorm}`;
		}
	}

	if (pattern !== null)
	{
		let patternNorm = normalizeString(pattern);

		if (utils.realStringLength(patternNorm) > 0)
		{
			itemNameNorm += `-${patternNorm}`;
		}
	}

	if (['fossils', 'photos', 'posters', 'diy', 'cooking'].includes(sourceSheetNorm))
	{
		return `${directory}${sourceSheetNorm}/${itemNameNorm}.png`;
	}

	return `${directory}${sourceSheetNorm}/storage/${itemNameNorm}.png`;
}
