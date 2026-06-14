// based on v1/node/lite.ts
type NodeLiteType = {
	id: number
	type: string
	parentId: number | null
	parentId2: number | null
	title: string
	locked: boolean
	threadType: string
	userId: number
};

export type { NodeLiteType };
