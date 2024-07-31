type ACGamePWPType = {
    id: string
    name: string
};

type PWPsType = {
    [id: string]: ACGamePWPType[]
};

export type { PWPsType, ACGamePWPType };