// based on v1/shop/thread
type ThreadType = {
    id: number
    title: string
    shop: {
        id: number
        name: string
    },
    formattedDate: string
    latestPage: number | null
    latestPost: number | null
};

export type { ThreadType };