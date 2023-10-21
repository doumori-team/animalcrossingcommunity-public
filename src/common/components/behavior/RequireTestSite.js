import React from 'react';
import PropTypes from 'prop-types';

import { constants } from '@utils';
import ErrorMessage from '@/components/layout/ErrorMessage.js';

/* Helper component. Requires to be on a test site to show children.
 * Otherwise shows permission error.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequireTestSite = ({children}) =>
{
	if (constants.LIVE_SITE)
	{
		return null;
	}
	else
	{
		return children;
	}
}

RequireTestSite.propTypes = {
	children: PropTypes.node.isRequired,
}

export default RequireTestSite;