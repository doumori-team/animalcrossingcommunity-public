import React from 'react';
import PropTypes from 'prop-types';

import { ErrorMessage } from '@layout';
import { PermissionsContext } from '@contexts';

/* Helper component. Specify a permission that its children require. If the
 * currently-logged-in user doesn't have that permission, displays an error
 * message instead of its children.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequirePermission = ({permission, silent, children}) =>
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

RequirePermission.propTypes = {
	permission: PropTypes.string.isRequired,
	silent: PropTypes.bool,
	children: PropTypes.node.isRequired,
}

RequirePermission.defaultProps = {
	silent: false,
}

export default RequirePermission;
