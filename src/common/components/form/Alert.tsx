import { ReactNode } from 'react';

/* An alert is a message that comes up to let the user know that
 * something has happened. For example, that an error has occurred, or that
 * a piece of information has changed.
 *
 * The message is styled after the dialogue boxes in AC:GC. (You may remember
 * this as a "Pablo box" from ACC 1.)
 *
 * The "type" prop indicates what type of message this is. This affects the
 * colour of the message box. Valid options are "error" (yellow), "success"
 * (green) and "info" (cyan). The default is "info".
 *
 * If the message does not require the user to respond to it, you are advised to
 * make the message disappear after a short time.
 */
const Alert = ({
	type = 'info',
	children,
}: AlertProps) =>
{
	let className = 'Alert';

	if (type === 'error')
	{
		className += ' Alert-error';
	}
	else if (type === 'success')
	{
		className += ' Alert-success';
	}
	else // info or warning
	{
		className += ' Alert-info';
	}

	// The accessibility attributes here make screen readers read out
	// the text as soon as it appears, regardless of where the user is
	// in the page
	return (
		<div className={className} role='alert' aria-live='polite'>
			{children}
		</div>
	);
};

type AlertProps = {
	type?: 'error' | 'success' | 'info' | 'warning'
	children: ReactNode | string
};

export default Alert;
