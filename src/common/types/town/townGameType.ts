import { ACGameType } from '../acgame/acgameType.ts';
import { FruitType } from '../acgame/fruitType.ts';
import { GrassShapeType } from '../acgame/grassShapeType.ts';
import { OrdinanceType } from '../acgame/ordinanceType.ts';
import { StoreType } from '../acgame/storeType.ts';
import { PWPsType } from '../data/pwpsType.ts';
import { ResidentsType } from '../data/residentsType.ts';
import { HemisphereType } from '../acgame/hemisphereType.ts';
import { PaintType } from '../acgame/paintType.ts';

type TownGameType = {
	info: ACGameType
	fruit: FruitType
	grassShapes: GrassShapeType[]
	ordinances: OrdinanceType[]
	stores: StoreType
	pwps: PWPsType[number]
	residents: ResidentsType[number]
	hemispheres: HemisphereType[]
	paintColors: PaintType[]
};

export type { TownGameType };
