import { describe, test, expect } from 'vitest';

import { loader } from '@/components/catchall.tsx';
import { constants } from '@utils';

function createRequest(path: string): Request
{
	return new Request(`https://example.com${path}`);
}

describe('redirect loader', () =>
{
	test('redirects old forums paths', () =>
	{
		// Act
		const res = loader({ request: createRequest('/forums') });

		// Assert
		expect(res.status).toBe(302);
		expect(res.headers.get('Location')).toBe(`/forums/${encodeURIComponent(constants.boardIds.accForums)}`);
	});

	test('redirects patterns.asp', () =>
	{
		// Act
		const res = loader({ request: createRequest('/patterns.asp') });

		// Assert
		expect(res.headers.get('Location')).toBe('/patterns');
	});

	test('redirects tp_home.asp', () =>
	{
		// Act
		const res = loader({ request: createRequest('/tp_home.asp') });

		// Assert
		expect(res.headers.get('Location')).toBe('/trading-post');
	});

	test('redirects topic paths with title', () =>
	{
		// Act
		const res = loader({ request: createRequest('/Topic/123/4/title-goes-here') });

		// Assert
		expect(res.headers.get('Location')).toBe('/forums/123/4');
	});

	test('redirects topic paths without title', () =>
	{
		// Act
		const res = loader({ request: createRequest('/Topic/123/4') });

		// Assert
		expect(res.headers.get('Location')).toBe('/forums/123/4');
	});

	test('returns 404 for unknown path', () =>
	{
		try
		{
			loader({ request: createRequest('/notfound') });
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		catch (e: any)
		{
			expect(e.status).toBe(404);
		}
	});

	test('redirects boards.asp same as /forums', () =>
	{
		// Act
		const res = loader({ request: createRequest('/boards.asp') });

		// Assert
		expect(res.status).toBe(302);
		expect(res.headers.get('Location')).toBe(`/forums/${encodeURIComponent(constants.boardIds.accForums)}`);
	});

	test('redirects Topic with only id and page (no trailing slash)', () =>
	{
		// Act
		const res = loader({ request: createRequest('/Topic/456/2') });

		// Assert
		expect(res.headers.get('Location')).toBe('/forums/456/2');
	});

	test('404 response body is JSON', () =>
	{
		try
		{
			loader({ request: createRequest('/notfound') });
			// Should not reach here
			expect.fail('Expected loader to throw');
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		catch (e: any)
		{
			expect(e.status).toBe(404);
			expect(e.headers.get('Content-Type')).toContain('application/json');
		}
	});

	test('redirects Topic paths with special characters in title', () =>
	{
		// Act
		const res = loader({ request: createRequest('/Topic/789/1/hello-world%20test') });

		// Assert
		expect(res.headers.get('Location')).toBe('/forums/789/1');
	});

	test('all redirects are 302', () =>
	{
		const paths = ['/forums', '/boards.asp', '/patterns.asp', '/tp_home.asp', '/Topic/1/1'];

		for (const path of paths)
		{
			const res = loader({ request: createRequest(path) });
			expect(res.status).toBe(302);
		}
	});
});
