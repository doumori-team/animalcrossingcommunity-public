import { EmojiSettingType } from '../setting/emojiSettingType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/shop/thread
type ThreadApplicationType = {
    id: number
    nodeId: number | null
    shop: {
        id: number
        name: string
    },
    formattedDate: string
    user: {
        id: number
        username: string
        lastActiveTime: string | null
        positiveWifiRatingsTotal: number
        neutralWifiRatingsTotal: number
        negativeWifiRatingsTotal: number
        positiveTradeRatingsTotal: number
        neutralTradeRatingsTotal: number
        negativeTradeRatingsTotal: number
        positiveShopRatingsTotal: number
        neutralShopRatingsTotal: number
        negativeShopRatingsTotal: number
        active30Days: number
    },
    role: string
    waitlisted: boolean
    contact: boolean
    games: {
        id: number
        shortname: string
    }[]
    application: {
        content: string
        format: MarkupStyleType
    },
    emojiSettings: EmojiSettingType[]
};

export type { ThreadApplicationType };