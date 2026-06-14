import { Request } from 'express';

type APIThisType = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	query: (method: string, params?: any, tryCache?: boolean) => any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fullQuery: (userId: NonNullable<Request['session']>['user'], method: string, params?: any, tryCache?: boolean) => any,
	userId: NonNullable<Request['session']>['user']
};

export type { APIThisType };
