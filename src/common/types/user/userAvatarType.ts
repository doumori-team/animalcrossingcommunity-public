import { BackgroundType } from '../avatar/backgroundType.ts';
import { CharacterType } from '../avatar/characterType.ts';
import { AccentType } from '../avatar/accentType.ts';
import { ColorationType } from '../avatar/colorationType.ts';

// based on v1/users/avatar
type UserAvatarType = {
    background: BackgroundType
    coloration: ColorationType | null
    character: CharacterType
    accent: AccentType | null
    accentPosition: number | null
};

export type { UserAvatarType };