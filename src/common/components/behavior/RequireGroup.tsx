import React from 'react';

import { ErrorMessage } from '@layout';
import { UserContext } from 'common/contexts.ts';
import { constants } from '@utils';

/* Helper component. Specify a user group that its children require. If the
 * currently-logged-in user doesn't have that group, displays an error
 * message instead of its children.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequireGroup = ({
	group,
	silent = false,
	children
}: RequireGroupProps) =>
{
    return (
        <UserContext.Consumer>
            {user => {
                if (!user && group != constants.groupIdentifiers.anonymous)
                {
                    return silent || (
                        <ErrorMessage identifier='permission' />
                    );
                }

                if (user?.group.identifier === group || (!user && group === constants.groupIdentifiers.anonymous))
                {
                    return children;
                }

                return silent || (
                    <ErrorMessage identifier='permission' />
                );
            }}
        </UserContext.Consumer>
    );
}

type RequireGroupProps = {
	group: string
	silent?: boolean
	children: React.ReactNode
};

export default RequireGroup;
