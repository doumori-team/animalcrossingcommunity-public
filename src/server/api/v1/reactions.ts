import * as db from '@db';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType, ReactionType, BellShopItemsType, BellShopCategoryType } from '@types';
import ACCReactions from 'common/markup/reaction.json';

async function reactions(this: APIThisType): Promise<ReactionType[]>
{
	if (!this.userId)
	{
		return [];
	}

	const [bellShopRedeemedItems]: [{
		item_id: number
	}[]] = await Promise.all([
		db.query(`
			SELECT user_bell_shop_redeemed.item_id
			FROM user_bell_shop_redeemed
			WHERE user_bell_shop_redeemed.user_id = $1::int AND (expires IS NULL OR expires > now())
		`, this.userId),
	]);

	const mappedBellShopRedeemedItems = bellShopRedeemedItems.map(i => i.item_id);

	const sortedBellShopItems: BellShopItemsType = await ACCCache.get(constants.cacheKeys.sortedBellShopItems);
	const bellShopCategories: BellShopCategoryType[] = await ACCCache.get(constants.cacheKeys.bellShopCategories);

	const bellShopReactionCategory = bellShopCategories.find(c => c.id === constants.bellShop.categories.reactionsId);
	const bellShopItems = bellShopReactionCategory !== undefined ? sortedBellShopItems[bellShopReactionCategory.id]['items'] : [];

	let accEmojis: ReactionType[] = [];

	for (let i = 0; i < ACCReactions.length; i++)
	{
		const src = ACCReactions[i];

		if (i >= 8)
		{
			const bellShopItem = bellShopItems.find(x => x.internalId === src);

			if (!bellShopItem || !mappedBellShopRedeemedItems.includes(bellShopItem.id))
			{
				continue;
			}
		}

		accEmojis.push({
			id: src,
			name: src,
			keywords: [src],
			src: `${constants.AWS_URL}/images/games/nh/reactions/${src}.png`,
		});
	}

	return accEmojis;
}

export default reactions;
