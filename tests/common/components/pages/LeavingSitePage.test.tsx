import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { MemoryRouter } from 'react-router';

import LeavingSitePage, { loader } from '@/components/pages/LeavingSitePage.tsx';
import { constants } from '@utils';

describe('LeavingSitePage', () =>
{
	test('should render the leaving site message and links', () =>
	{
		// Arrange
		const mockUrl = 'https://example.com';

		// Act
		render(
			<MemoryRouter initialEntries={[`/leaving?url=${mockUrl}`]}>
				<LeavingSitePage />
			</MemoryRouter>,
		);

		// Assert
		expect(screen.getByText(/Notice: You are potentially leaving ACC./i)).toBeDefined();
		expect(screen.getByText(mockUrl)).toBeDefined();
		expect(screen.getByText(/Go back to ACC/)).toBeDefined();
	});

	test('should redirect for all approved URLs', () =>
	{
		for (const approvedUrl of constants.approvedURLs)
		{
			const res = loader({ request: new Request(`https://www.animalcrossingcommunity.com/leaving?url=${approvedUrl}`) });

			// Ensure redirect is called for each approved URL
			expect(res!.headers.get('Location')).toBe(approvedUrl);
		}
	});

	test('should not redirect for unapproved URLs', () =>
	{
		// Arrange
		const unapprovedUrl = 'https://unapproved.com';

		// Act
		const res = loader({ request: new Request(`https://www.animalcrossingcommunity.com/leaving?url=${unapprovedUrl}`) });

		// Assert
		expect(res).toEqual(null);
	});

	test('should not redirect when url param is missing', () =>
	{
		const res = loader({ request: new Request('https://www.animalcrossingcommunity.com/leaving') });
		expect(res).toEqual(null);
	});

	test('should not redirect when url param is empty', () =>
	{
		const res = loader({ request: new Request('https://www.animalcrossingcommunity.com/leaving?url=') });
		expect(res).toEqual(null);
	});

	test('should not redirect for URL that starts with approved URL but is a different domain', () =>
	{
		// If e.g. https://nintendo.com is approved, https://nintendo.com.evil.com should NOT redirect
		for (const approvedUrl of constants.approvedURLs)
		{
			if (approvedUrl === '/')
			{
				continue;
			}

			const maliciousUrl = `${approvedUrl}.evil.com`;
			const res = loader({ request: new Request(`https://www.animalcrossingcommunity.com/leaving?url=${maliciousUrl}`) });

			// If this passes (res is null), your loader is safe.
			// If this FAILS, you have an open redirect vulnerability — startsWith is too permissive.
			expect(res).toEqual(null);
		}
	});

	test('approved URL redirect is 302', () =>
	{
		const approvedUrl = constants.approvedURLs[0];
		const res = loader({ request: new Request(`https://www.animalcrossingcommunity.com/leaving?url=${approvedUrl}`) });
		expect(res!.status).toBe(302);
	});

	test('external link has rel nofollow', () =>
	{
		const mockUrl = 'https://example.com';
		render(
			<MemoryRouter initialEntries={[`/leaving?url=${mockUrl}`]}>
				<LeavingSitePage />
			</MemoryRouter>,
		);

		const externalLink = screen.getByText(mockUrl);
		expect(externalLink.getAttribute('rel')).toBe('ugc nofollow');
		expect(externalLink.getAttribute('href')).toBe(mockUrl);
	});

	test('ACC link points to site URL', () =>
	{
		const mockUrl = 'https://example.com';
		render(
			<MemoryRouter initialEntries={[`/leaving?url=${mockUrl}`]}>
				<LeavingSitePage />
			</MemoryRouter>,
		);

		const accLink = screen.getByText(/Go back to ACC/);
		expect(accLink.getAttribute('href')).toBe(constants.SITE_URL);
	});

	test('should not redirect for URL that starts with approved URL but is a different domain', () =>
	{
		for (const approvedUrl of constants.approvedURLs)
		{
			if (approvedUrl === '/')
			{
				continue;
			}

			const maliciousUrl = `${approvedUrl}.evil.com`;
			const res = loader({ request: new Request(`https://www.animalcrossingcommunity.com/leaving?url=${maliciousUrl}`) });
			expect(res).toEqual(null);
		}
	});
});
