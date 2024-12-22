import React from 'react';

import { ERROR_MESSAGES } from '@errors';
import { Alert } from '@form';
import HTMLPurify from '@/components/layout/HTMLPurify.tsx';

/* Component to show an error message. This is like <Alert type='error'>,
 * but the content of the message is taken from `common/errors.js`.
 *
 * The "identifier" prop is the identifier of the error in errors.js. For
 * exmaple, <ErrorMessage identifier='test' /> produces an error message that
 * says "This is a test error message."
 */
const ErrorMessage = ({
	identifier,
	message,
}: ErrorMessageProps) =>
{
	return (
		<Alert type='error'>
			{message ?
				<HTMLPurify className='error_message' html={message} />
				:
				<>
					<strong>{'Sorry!'}</strong>{' '}
					{
						identifier && (ERROR_MESSAGES as any)[identifier]
							? <HTMLPurify className='error_message' html={(ERROR_MESSAGES as any)[identifier].message} />
							: 'While trying to display an error message, another error occurred. Please let us know about this on the Site Support board and we’ll look into it. Sorry for the inconvenience.'
					}
				</>
			}
		</Alert>
	);
};

type ErrorMessageProps = {
	identifier?: string
	message?: string
};

export default ErrorMessage;
