// based on v1/friend_code
type FriendCodeType = {
	id: number
	userId: number
	code: string
	game: {
		id: number
		acGameId: number
	}
	name: string
	pattern: string
	placeholder: string
	character: {
		id: number
		name: string
		town: {
			id: number
			name: string
		}
		game: {
			id: number
		}
	}
	username: string
};

export type { FriendCodeType };