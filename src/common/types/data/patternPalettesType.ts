type PatternPalettesType = {
	paletteId: number,
	colors: string[]
}[] | {
	[id: number]: {
		paletteId: number,
		colors: string[]
	}[]
};

export type { PatternPalettesType };
