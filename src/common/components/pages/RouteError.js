import React from 'react';
import { useRouteError } from 'react-router';
import { Link } from 'react-router-dom';

import Alert from '@/components/form/Alert.js';
import { constants } from '@utils';

const RouteError = () =>
{
    const error = useRouteError();

    console.error('Route Error Occurred:');
    console.error(error);

	return (
        <div className='RouteError'>
            <Alert type='error'>
                Sorry! Looks like something unexpected happened. You can <Link to={constants.SITE_URL} reloadDocument>click here</Link> to go back to homepage.
            </Alert>
        </div>
	);
}

export default RouteError;