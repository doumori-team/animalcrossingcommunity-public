import React from 'react';

import { ErrorMessage } from '@layout';
import { PermissionsContext } from '@contexts';

/* Helper component. Specify a permission that its children require. If the
 * currently-logged-in user doesn't have that permission, displays an error
 * message instead of its children.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequirePermission = ({
	permission,
	silent = false,
	children
}: RequirePermissionProps) =>
{
    return (
        <PermissionsContext.Consumer>
            {permissions =>
                {
                    if (permissions.indexOf(permission) === -1)
                    {
                        return silent || (
                            <ErrorMessage identifier='permission' />
                        );
                    }
                    else
                    {
                        return children;
                    }
                }
            }
        </PermissionsContext.Consumer>
    );
}

type RequirePermissionProps = {
	permission: string
	silent?: boolean
	children: React.ReactNode
};

export default RequirePermission;
