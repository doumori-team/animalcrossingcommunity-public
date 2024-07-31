import React from 'react';

import { Button } from '@form';

/* Button which brings the user to a login form. */

const LoginButton = () =>
{
	return (
		<form action='/auth/go' method='GET'>
			<Button
				type='submit'
				className='LoginButton'
				label='Log In'
			/>
		</form>
	);
}

export default LoginButton
