import React from 'react';

import { Button } from '@form';

/* Button which logs the user out of their session, if they currently have one
 * active.
 */

const LogoutButton = ({
	buttonText = 'Log Out'
}: LogoutButtonProps) =>
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

type LogoutButtonProps = {
	buttonText?: string
};

export default LogoutButton;
