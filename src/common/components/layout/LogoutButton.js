import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@form';

/* Button which logs the user out of their session, if they currently have one
 * active.
 */

const LogoutButton = ({buttonText}) =>
{
	return (
		<form action='/auth/logout' method='POST'>
			<Button
				type='submit'
				className='LogoutButton'
				label={buttonText}
			/>
		</form>
	);
}

LogoutButton.propTypes = {
	buttonText: PropTypes.string,
};

LogoutButton.defaultProps = {
	buttonText: 'Log Out',
};

export default LogoutButton;
