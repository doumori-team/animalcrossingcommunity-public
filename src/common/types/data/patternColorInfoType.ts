type ColorInfoType = {
    hex: string
    hue: number
    vividness: number
    brightness: number
};

type PatternColorInfoType = {
    [id: number]: ColorInfoType[]
} | ColorInfoType[];

export type { PatternColorInfoType };