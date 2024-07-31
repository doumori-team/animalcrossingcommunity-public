import { BackgroundType } from '../data/backgroundType.ts';
import { CharacterType } from '../data/characterType.ts';
import { AccentType } from '../data/accentType.ts';
import { ColorationType } from '../data/colorationType.ts';

// based on v1/users/avatars
type UserAvatarsType = {
    results: {
        id: number
        background: BackgroundType | null
        character: CharacterType | null
        accent: AccentType | null
        accentPosition: number | null
        coloration: ColorationType | null
    }[]
    count: number
    page: number
    pageSize: number
};

export type { UserAvatarsType };