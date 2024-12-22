import { ACGameType } from '../acgame/acgameType.ts';
import { FaceType } from '../acgame/faceType.ts';
import { BedLocationType } from '../acgame/bedLocationType.ts';
import { HouseSizeType } from '../acgame/houseSizeType.ts';
import { PaintType } from '../acgame/paintType.ts';
import { MonumentType } from '../acgame/monumentType.ts';

type CharacterGameType = {
	info: ACGameType
	houseSizes: HouseSizeType[]
	bedLocations: BedLocationType[]
	faces: FaceType[]
	paintColors: PaintType[]
	monuments: MonumentType[]
};

export type { CharacterGameType };
