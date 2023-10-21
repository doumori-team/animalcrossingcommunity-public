import React from 'react';
import PropTypes from 'prop-types';

import * as markup from 'common/markup.js';
import { emojiSettingsShape } from '@propTypes';
import HTMLPurify from './HTMLPurify.js';

/* Converts forum markup into HTML.
 *
 * Accepts props:
 *	- text: The unparsed markup.
 * 	- format: The syntax used. May be 'plaintext', 'bbcode', 'bbcode+html',
 * 			'markdown', or 'markdown+html'.
 * 	- emojiSettings: user emoji settings, for preview and gendered emojis
 */

const Markup = ({text, format, emojiSettings}) =>
{
	const formatClassName = format.split('+')[0];

	return (
		<HTMLPurify
			className={`Markup Markup-${formatClassName}`}
			html={markup.parse({
				text: text,
				format: format,
				emojiSettings: emojiSettings,
			})}
		/>
	);
}

Markup.propTypes = {
	text: PropTypes.string.isRequired,
	format: PropTypes.string.isRequired,
	emojiSettings: emojiSettingsShape,
}

export default Markup;