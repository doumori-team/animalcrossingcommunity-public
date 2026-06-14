// based on v1/node/reactions.ts
type NodeReactionType = {
	emoji: string
	src: string
	users: {
		id: number
		username: string
	}[]
};

export type { NodeReactionType };
