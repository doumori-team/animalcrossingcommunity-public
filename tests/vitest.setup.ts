import { vi, beforeEach } from 'vitest';

import * as db from '@db';
import { iso } from 'common/iso.ts';
import { ACCCache } from '@cache';
import { AppLoadContextType } from '@types';

vi.mock('@db', () => ({
	query: vi.fn(),
	transaction: vi.fn(),
	profanityCheck: vi.fn(),
	getUserGroups: vi.fn(() => [1,0]),
}));

export const mockDbQuery = db.query as any;

vi.mock('@cache', () => ({
	ACCCache: {
		deleteMatch: vi.fn(),
		get: vi.fn(),
	},
}));

export const mockACCCache = ACCCache as any;

vi.mock('common/iso.ts', () => ({
	iso: Promise.resolve({
		query: vi.fn(),
	}),
}));

export const mockISOQuery = (await iso).query as any;

export const mockAPIContext = {
	userId: 5,
	query: vi.fn(),
};

export const mockAppContext: AppLoadContextType = {
	session: {
		user: mockAPIContext.userId,
		username: 'test-user',
	},
};

beforeEach(async () =>
{
	vi.clearAllMocks();
});
