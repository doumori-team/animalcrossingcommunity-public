import { vi, beforeEach, Mock } from 'vitest';

import * as db from '@db';
import { iso } from 'common/iso.ts';
import { ACCCache } from '@cache';
import * as accounts from '@accounts';

vi.mock('@db', () => ({
	query: vi.fn(),
	cacheQuery: vi.fn(),
	transaction: vi.fn(),
	profanityCheck: vi.fn(),
	getUserGroups: vi.fn(() => [1,0]),
	updateThreadStats: vi.fn(),
	regenerateTopBells: vi.fn(),
	updatePTsLookup: vi.fn(),
}));

export const mockDbQuery = db.query as Mock;
export const mockCacheQuery = db.cacheQuery as Mock;
export const mockDbProfanity = db.profanityCheck as Mock;

vi.mock('@cache', () => ({
	ACCCache: {
		deleteMatch: vi.fn(),
		get: vi.fn(),
	},
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockACCCache = ACCCache as any;

vi.mock('common/iso.ts', () => ({
	iso: Promise.resolve({
		query: vi.fn(),
	}),
}));

export const mockISOQuery = (await iso).query as Mock;

export const mockAPIContext = {
	userId: 5,
	query: vi.fn(),
	fullQuery: vi.fn(),
};

export const mockAppContext = {
	session: {
		user: mockAPIContext.userId,
		username: 'test-user',
	},
};

vi.mock('@accounts', () => ({
	getData: vi.fn(),
	emailUser: vi.fn(),
	getUserData: vi.fn(),
	signup: vi.fn(),
	pushData: vi.fn(),
}));

export const mockAccountsGetData = accounts.getData as Mock;
export const mockAccountsEmailUser = accounts.emailUser as Mock;
export const mockAccountsGetUserData = accounts.getUserData as Mock;
export const mockAccountsSignup = accounts.signup as Mock;
export const mockAccountsPushData = accounts.pushData as Mock;

beforeEach(async () =>
{
	vi.resetAllMocks();
});

export async function fetchWithRetry(url: string, method: 'GET' | 'POST' = 'GET', expectHit: boolean = true, visitor: boolean = true): Promise<Response>
{
	const tryFetch = async () =>
	{
		const res = await fetch(url, {
			method: method,
			headers: {
				'Referer': 'https://www.animalcrossingcommunity.com',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
				'Cookie': visitor ? '' : 'connect.sid=REPLACEME',
			},
		});
		const xCache = res.headers.get('x-cache')?.toLowerCase() || '';
		return { res, xCache };
	};

	const first = await tryFetch();

	if (expectHit && !first.xCache.includes('hit'))
	{
		const second = await tryFetch();
		return second.res;
	}

	return first.res;
}

vi.mock('web-push', () => ({
	default: {
		setVapidDetails: vi.fn(),
		sendNotification: vi.fn(),
	},
}));
