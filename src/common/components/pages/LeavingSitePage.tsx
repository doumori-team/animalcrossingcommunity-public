import React from 'react';
import { useLocation } from 'react-router-dom';

import { Alert } from '@form';
import { constants } from '@utils';
import { LocationType } from '@types';

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

export default LeavingSitePage;
