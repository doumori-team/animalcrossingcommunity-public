import React from 'react';
import PropTypes from 'prop-types';

import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.js';

const MarkupButton = ({tag, clickHandler, name, keyHint, icon}) =>
{
	const tooltip = keyHint ? `${name} (${keyHint})` : name;

	const interactivityAttributes =
		tag ?
			{ onClick: event => {event.preventDefault(); clickHandler(tag);} }
		:
			{ disabled: true }
	;

	return (
		<button
			className='MarkupButton'
			title={tooltip}
			{...interactivityAttributes}
			aria-label={name}
		>
			<FontAwesomeIcon name={icon} alt={name} />
		</button>
	);
}

MarkupButton.propTypes = {
	tag: PropTypes.object, // details of the tag, retrieved from the dicts at the top of markup.js.
						   // If not present, the tag is not supported in the selected markup style,
						   // so the button should be disabled
	clickHandler: PropTypes.func.isRequired, // function to call to insert the tag into the text area
	name: PropTypes.string.isRequired, // name of the tag, displayed on hover
	keyHint: PropTypes.string, // keypress (if any) to , displayed on hover
	icon: PropTypes.string.isRequired // name of icon (from Font Awesome) to show on the button
}

export default MarkupButton;