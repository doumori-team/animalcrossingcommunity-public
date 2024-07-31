import React from 'react';

import { constants } from '@utils';

/* Helper component. Requires to be on a test site to show children.
 * Otherwise shows permission error.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequireTestSite = ({
	children
}: RequireTestSiteProps) =>
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

type RequireTestSiteProps = {
	children: React.ReactNode
};

export default RequireTestSite;