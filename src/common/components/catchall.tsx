import { redirect, matchPath, Link } from 'react-router';

import { URL } from 'url';

import { constants } from '@utils';

// we should never actually see this
export default function Component()
{
	return <div>
		Sorry! Looks like something unexpected happened. You can <Link to={constants.SITE_URL} reloadDocument>click here</Link> to go back to homepage.
	</div>;
}

export const loader = ({ request }: { request: any }) =>
{
	const url = new URL(request.url);

	switch (url.pathname)
	{
		case '/forums':
		case '/boards.asp':
			return redirect(`/forums/${encodeURIComponent(constants.boardIds.accForums)}`);
		case '/patterns.asp':
			return redirect(`/patterns`);
		case '/tp_home.asp':
			return redirect(`/trading-post`);
		default:
		{
			const patterns = ['Topic/:id/:page', 'Topic/:id/:page/:title'];

			for (const pattern of patterns)
			{
				const match = matchPath(pattern, url.pathname);

				if (match)
				{
					return redirect(`/forums/${encodeURIComponent(match.params.id as any)}/${encodeURIComponent(match.params.page as any)}`);
				}
			}
		}
	}

	throw Response.json(
		'Not Found',
		{ status: 404 },
	);
};
