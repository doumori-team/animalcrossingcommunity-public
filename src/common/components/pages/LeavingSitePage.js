import React from 'react';
import { useSearchParams } from 'react-router-dom';

import Alert from '@/components/form/Alert.js';
import { constants } from '@utils';

const LeavingSitePage = () =>
{
	const [searchParams, setSearchParams] = useSearchParams();
	const url = searchParams.get('url');

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
}

export default LeavingSitePage;