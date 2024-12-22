import React from 'react';

import * as markup from 'common/markup.ts';
import { EmojiSettingType, MarkupFormatType } from '@types';
import HTMLPurify from '@/components/layout/HTMLPurify.tsx';
import { UserContext } from '@contexts';

/* Converts forum markup into HTML.
 *
 * Accepts props:
 *	- text: The unparsed markup.
 * 	- format: The syntax used. May be 'plaintext', 'bbcode', 'bbcode+html',
 * 			'markdown', or 'markdown+html'.
 * 	- emojiSettings: user emoji settings, for preview and gendered emojis
 */

const Markup = ({
	text,
	format,
	emojiSettings,
}: MarkupProps) =>
{
	const formatClassName = format.split('+')[0];

	return (
		<UserContext.Consumer>
			{currentUser =>
				<HTMLPurify
					className={`Markup Markup-${formatClassName}`}
					html={markup.parse({
						text: text,
						format: format,
						emojiSettings: emojiSettings,
						currentUser: currentUser,
					})}
				/>
			}
		</UserContext.Consumer>
	);
};

type MarkupProps = {
	text: string
	format: MarkupFormatType
	emojiSettings?: EmojiSettingType[]
};

export default Markup;
