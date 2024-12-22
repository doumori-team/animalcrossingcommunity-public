import React from 'react';
import { useRouteError } from 'react-router';
import { Link } from 'react-router-dom';

import { constants, utils } from '@utils';
import { ErrorMessage } from '@layout';
import { Alert } from '@form';

const RouteError = () =>
{
	const error = useRouteError() as any;

	console.error('Route Error Occurred:');
	console.error(error);

	if (utils.realStringLength(error.statusText) > 0)
	{
		return (
			<div className='RouteError'>
				<ErrorMessage identifier={error.statusText} />
			</div>
		);
	}

	return (
		<div className='RouteError'>
			<Alert type='error'>
				Sorry! Looks like something unexpected happened. You can <Link to={constants.SITE_URL} reloadDocument>click here</Link> to go back to homepage.
			</Alert>
		</div>
	);
};

export default RouteError;
