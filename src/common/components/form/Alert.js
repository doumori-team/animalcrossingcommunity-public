import React from 'react';
import PropTypes from 'prop-types';

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
const Alert = ({type, children}) =>
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
	else
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
}

Alert.propTypes = {
	type: PropTypes.oneOf(['error', 'success', 'info']).isRequired,
	children: PropTypes.node.isRequired,
}

Alert.defaultProps = {
	type: 'info',
}

export default Alert;