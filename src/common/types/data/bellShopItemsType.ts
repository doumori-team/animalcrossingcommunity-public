import { BackgroundType } from '../data/backgroundType.ts';
import { CharacterType } from '../data/characterType.ts';
import { AccentType } from '../data/accentType.ts';
import { ColorationType } from '../data/colorationType.ts';

type PriceType = {
    id: number
    price: string
    nonFormattedPrice: number
    isBells: boolean
    currency: string
};

type BellShopItemType = {
    id: number
    internalId: string
    name: string
    categoryId: number
    description: string | null
    avatar: {
        background: BackgroundType | null
        character: CharacterType | null
        accent: AccentType | null
        accentPosition: number | null
        coloration: ColorationType | null
    } | null
    expireDurationMonths: number | null
    expires: string | null
    prices: PriceType[]
    releaseDate: string
};

type BellShopItemsType = {
    [id: number]: BellShopItemType[]
    all: {
        [id: number]: BellShopItemType
    }
    price: {
        [id: number]: {
            [id: number]: {
                item: BellShopItemType
                price: PriceType
            }
        }
    }
};

export type { BellShopItemsType };