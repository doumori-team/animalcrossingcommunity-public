import { ACGameType } from '../acgame/acgameType.ts';
import { FaceType } from '../acgame/faceType.ts';
import { BedLocationType } from '../acgame/bedLocationType.ts';
import { HouseSizeType } from '../acgame/houseSizeType.ts';

type CharacterGameType = {
	info: ACGameType
	houseSizes: HouseSizeType[]
	bedLocations: BedLocationType[]
	faces: FaceType[]
};

export type { CharacterGameType };