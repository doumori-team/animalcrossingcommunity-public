import React from 'react';
import PropTypes from 'prop-types';

import ErrorMessage from '@/components/layout/ErrorMessage.js';
import { UserContext } from 'common/contexts.js';
import { constants } from '@utils';

/* Helper component. Specify a user group that its children require. If the
 * currently-logged-in user doesn't have that group, displays an error
 * message instead of its children.
 *
 * Include the optional "silent" prop to suppress the error message.
 */
const RequireGroup = ({group, silent, children}) =>
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

RequireGroup.propTypes = {
	group: PropTypes.string,
	silent: PropTypes.bool,
	children: PropTypes.node
}

export default RequireGroup;
