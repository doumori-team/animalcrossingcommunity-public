type FileInProcessType = {
	id?: number
	fileId: string
	name: string
	width: number | null
	height: number | null
	caption?: string
};

type FileType = {
	id: number
	fileId: string
	name: string
	width: number | null
	height: number | null
	caption: string
};

export type { FileType, FileInProcessType };
