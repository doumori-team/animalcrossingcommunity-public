type TreasureLocationType = 'content_top' | 'content_bottom';

type TreasureType = {
	id: number
	treasureTypeId: number
	location: TreasureLocationType
};

export type { TreasureType, TreasureLocationType };
