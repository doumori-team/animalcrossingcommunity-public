import { ThreadOrderType } from './threadOrderType.ts';
import { ThreadApplicationType } from './threadApplicationType.ts';
import { ThreadType } from './threadType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/shop/threads
type ThreadsType = {
	results: ThreadOrderType[] | ThreadApplicationType[] | ThreadType[]
	count: number
	page: number
	pageSize: number
	shopId: number
	category: string
	type: string
	status: string
	waitlisted: string
	locked: boolean
	shops: {
		id: number
		name: string
		employee: boolean
	}[]
	markupStyle: MarkupStyleType | null
};

export type { ThreadsType };
