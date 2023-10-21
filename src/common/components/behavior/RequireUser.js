import React from 'react';
import PropTypes from 'prop-types';

import RequirePermission from '@/components/behavior/RequirePermission.js';
import { UserContext } from '@contexts';
import { ErrorMessage } from '@layout';

/* Helper component. If the user is logged in, child components are shown.
 * Otherwise, an error message will appear.
 *
 * Optionally, you can specify a User ID. If the current user matches the given
 * user's ID, children components are shown.
 *
 * Optionally, also specify a permission. Users must have this permission
 * and be the right user.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequireUser = ({id, permission, silent, children}) =>
{
	return (
		<UserContext.Consumer>
			{user => {
				if (user)
				{
					if (permission)
					{
						if (!id || user.id === id)
						{
							return (
								<RequirePermission permission={permission} silent={silent}>
									{children}
								</RequirePermission>
							);
						}
					}
					else if (!id || user.id === id)
					{
						return children;
					}
				}

				return silent || (
					<ErrorMessage identifier='login-needed' />
				);
			}}
		</UserContext.Consumer>
	);
}

RequireUser.propTypes = {
	id: PropTypes.number,
	permission: PropTypes.string,
	silent: PropTypes.bool,
	children: PropTypes.node
}

export default RequireUser;
