type NodeChildrenResultType = {
	id: number
	type: string
	user_id: number
	parent_node_id: number
	parent_node_id2: number | null
	post_number: number
	page_number: number
	creation_time: string
	locked: boolean
	thread_type: string
	latest_reply_time: string
	reply_count: string
	count: string
	revision_id: number
	title: string
	content: string
	content_format: string
};

export type { NodeChildrenResultType };
