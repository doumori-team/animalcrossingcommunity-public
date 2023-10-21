import React from 'react';
import PropTypes from 'prop-types';

import { ERROR_MESSAGES } from '@errors';
import Alert from '@/components/form/Alert.js';
import HTMLPurify from './HTMLPurify.js';

/* Component to show an error message. This is like <Alert type='error'>,
 * but the content of the message is taken from `common/errors.js`.
 *
 * The "identifier" prop is the identifier of the error in errors.js. For
 * exmaple, <ErrorMessage identifier='test' /> produces an error message that
 * says "This is a test error message."
 */
const ErrorMessage = ({identifier, message}) =>
{
	return (
		<Alert type='error'>
			{message ? (
				message
			) : (
				<>
				<strong>{'Sorry!'}</strong>{' '}
				{
					ERROR_MESSAGES[identifier]
						? <HTMLPurify className='error_message' html={ERROR_MESSAGES[identifier].message} />
						: 'While trying to display an error message, another error occurred. Please let us know about this on the Site Support board and we’ll look into it. Sorry for the inconvenience.'
				}
				</>
			)}
		</Alert>
	);
}

ErrorMessage.propTypes = {
	identifier: PropTypes.string,
	message: PropTypes.string,
}

export default ErrorMessage;