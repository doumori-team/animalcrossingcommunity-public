// based on v1/admin/game/game
type GameType = {
	id: number
	gameConsoleId: number
	name: string
	shortName: string
	pattern: string
	placeholder: string
	sequence: number
	isEnabled: boolean
};

export type { GameType };
