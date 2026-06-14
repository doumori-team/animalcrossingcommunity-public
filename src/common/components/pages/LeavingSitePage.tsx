import { useLocation, redirect, ActionFunctionArgs } from 'react-router';

import { Alert } from '@form';
import { constants, routerUtils } from '@utils';
import { LocationType } from '@types';

export const action = routerUtils.formAction;

const LeavingSitePage = () =>
{
	const location = useLocation() as LocationType;
	const url = location.search.substring(5);

	return (
		<div className='LeavingSitePage'>
			<Alert type='error'>
				<h2>Notice: You are potentially leaving ACC.</h2>
				Continue using link: <a rel='ugc nofollow' href={url}>{url}</a>
				<br/>
				OR
				<br/>
				<a href={constants.SITE_URL}>Go back to ACC</a>
			</Alert>
		</div>
	);
};

export const loader = ({ request }: { request: ActionFunctionArgs['request'] }) =>
{
	const searchParams = new URL(request.url).searchParams;
	const url = searchParams.get('url');

	if (url && constants.approvedURLs.find(au => url.startsWith(au) && (au === '/' || url.length === au.length || ['/', '?', '#'].includes(url[au.length]))))
	{
		return redirect(url);
	}

	return null;
};

export default LeavingSitePage;
