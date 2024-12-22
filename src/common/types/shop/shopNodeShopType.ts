import { ThreadOrderType } from './threadOrderType.ts';
import { ThreadApplicationType } from './threadApplicationType.ts';

// based on v1/shop/node/shop
type ShopNodeShopType = {
	id: number
	name: string
	customerIds: number[]
	userId: number
	order: ThreadOrderType | null
	application: ThreadApplicationType | null
};

export type { ShopNodeShopType };
