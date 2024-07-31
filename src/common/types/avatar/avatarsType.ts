import { BackgroundType } from '../avatar/backgroundType.ts';
import { CharacterType } from '../avatar/characterType.ts';
import { AccentType } from '../avatar/accentType.ts';
import { ColorationType } from '../avatar/colorationType.ts';
import { TagType } from '../avatar/tagType.ts';

// based on v1/avatars
type AvatarsType = {
    backgrounds: BackgroundType[]
    accents: AccentType[]
    characters: CharacterType[]
    colorations: ColorationType[]
    tags: {
        characterTags: TagType[]
        accentTags: TagType[]
        backgroundTags: TagType[]
    },
};

export type { AvatarsType };