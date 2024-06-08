import React from 'react';
import PropTypes from 'prop-types';

import emojiDefs from 'common/markup/emoji.json' assert { type: "json"};
import { emojiSettingsShape } from '@propTypes';
import { constants } from '@utils';

const EmojiButton = ({tag, clickHandler, name, keyHint, icon, type, emojiSettings}) =>
{
	const tooltip = keyHint ? `${name} (${keyHint})` : name;

	const interactivityAttributes =
		tag ?
			{ onClick: event => {event.preventDefault(); clickHandler(tag);} }
		:
			{ disabled: true }
	;

	let src = '';
	const setting = emojiSettings.find(s => s.type === type);

	if (setting)
	{
		src = `${setting.category}/`;
	}
	else if (Object.keys(emojiDefs[0]).includes(type))
	{
		src = `reaction/`;
	}

	return (
		<button className='EmojiButton'
				title={tooltip}
				{...interactivityAttributes}>
			<img src={`${constants.AWS_URL}/images/emoji/${src}${icon}.png`} alt={name} />
		</button>
	);
}

EmojiButton.propTypes = {
	tag: PropTypes.string, // details of the tag, retrieved from the dicts at the top of markup.js.
						   // If not present, the tag is not supported in the selected markup style,
						   // so the button should be disabled
	clickHandler: PropTypes.func.isRequired, // function to call to insert the tag into the text area
	name: PropTypes.string.isRequired, // name of the tag, displayed on hover
	keyHint: PropTypes.string, // keypress (if any) to , displayed on hover
	icon: PropTypes.string.isRequired, // name of image to show on the button
	type: PropTypes.string, // type from emoji.json
	emojiSettings: emojiSettingsShape, // user settings
}

export default EmojiButton;