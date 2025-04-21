interface AppLoadContextType
{
	session?: {
		user: number | null
		username: string | null
	};
	headers?: any
	httpVersion?: string
	method?: string
	url?: string
}

export type { AppLoadContextType };
