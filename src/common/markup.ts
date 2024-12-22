import { escapeHtml } from './markup/utils.ts';
import parseBbcode from './markup/bbcode.ts';
import parseMarkdown from './markup/markdown.ts';

import { UserType, EmojiSettingType, MarkupFormatType } from '@types';

// These are used to determine what the buttons in the Quick Markup bar should insert
export const markdownTags = {
	'bold': { start: '**', end: '**' },
	'italic': { start: '*', end: '*' },
	'underline': { start: '++', end: '++' },
	'strikethrough': { start: '~~', end: '~~' },
	'heading': { prefix: '# ' },
	'quote': { prefix: '> ' },
	'monospace': { start: '`', end: '`' },
	'list': { prefix: '* ' },
	'color': { start: '{color:$}', attrName: 'Color', attrType: 'color', end: '{color}' },
	'spoiler': { start: '!!', end: '!!' },
	'link': { start: '[', attrName: 'URL', attrType: 'url', end: ']($)' },
	'table': { prefix: `| Header 1 | Header 2 |
| - | - |
| Col 1, Row 1 | Col 2, Row 1 |
| Col 1, Row 2 | Col 2, Row 2 |` },
	'center': { start: '{center}', end: '{center}' },
	'line': { prefix: '---' },
	'usertag': { start: '@', attrName: 'Username', attrType: 'username', end: '$' },
};

export const markdownHtmlTags = {
	...markdownTags,
	'image': { prefix: '![TITLE](IMAGE)' },
	'anchor': { prefix: '[TEXT](#TAG)' },
};

export const traditionalTags = {
	'bold': { start: '[b]', end: '[/b]' },
	'italic': { start: '[i]', end: '[/i]' },
	'underline': { start: '[u]', end: '[/u]' },
	'strikethrough': { start: '[s]', end: '[/s]' },
	'quote': { start: '[bq]', end: '[/bq]' },
	'monospace': { start: '[code]', end: '[/code]' },
	'color': { start: '[color=$]', attrName: 'Color', attrType: 'color', end: '[/color]' },
	'spoiler': { start: '[spoiler]', end: '[/spoiler]' },
	'link': { start: '[link=$]', attrName: 'URL', attrType: 'url', end: '[/link]' },
	'line': { prefix: '[hr]' },
	'usertag': { start: '@', attrName: 'Username', attrType: 'username', end: '$' },
};

// What emoji should insert

export const markdownEmoji = {
	'smile': ':smile:',
	'frowning_face': ':frowning_face:',
	'grin': ':grin:',
	'smiling_face_with_two_hearts': ':smiling_face_with_two_hearts:',
	'shifty': ':shifty:',
	'sunglasses': ':sunglasses:',
	'smiling_imp': ':smiling_imp:',
	'stuck_out_tongue': ':stuck_out_tongue:',
	'rage': ':rage:',
	'laughing': ':laughing:',
	'wink': ':wink:',
	'blush': ':blush:',
	'cry': ':cry:',
	'confused': ':confused:',
	'astonished': ':astonished:',
	'neutral_face': ':neutral_face:',
	'nauseated_face': ':nauseated_face:',
	'roll_eyes': ':roll_eyes:',
	'resetti': ':resetti:',
	'blanca': ':blanca:',
	'gyroid': ':gyroid:',
	'serena': ':serena:',
	'kk': ':kk:',
	'nat': ':nat:',
	'owner': ':owner:',
	'admin': ':admin:',
	'mod': ':mod:',
	'scout': ':scout:',
	'researcher': ':researcher:',
	'dev': ':dev:',
	'hc': ':hc:',
	'birthday': ':birthday:',
	'newbie': ':newbie:',
	'buddy': ':buddy:',
	'unflag': ':unflag:',
	'flag': ':flag:',
	'edit': ':edit:',
	'message': ':message:',
	'report': ':report:',
	'idea': ':idea:',
	'trade': ':trade:',
	'wifi': ':wifi:',
	'lock': ':lock:',
	'sticky': ':sticky:',
	'help_button': ':help_button:',
	'feedback_positive': ':feedback_positive:',
	'feedback_negative': ':feedback_negative:',
	'feedback_neutral': ':feedback_neutral:',
};

export const traditionalEmoji = {
	'smile': '[face_happy]',
	'frowning_face': '[face_sad]',
	'grin': '[face_grin]',
	'smiling_face_with_two_hearts': '[face_love]',
	'shifty': '[face_mischief]',
	'sunglasses': '[face_cool]',
	'smiling_imp': '[face_devil]',
	'stuck_out_tongue': '[face_silly]',
	'rage': '[face_angry]',
	'laughing': '[face_laugh]',
	'wink': '[face_wink]',
	'blush': '[face_blush]',
	'cry': '[face_cry]',
	'confused': '[face_confused]',
	'astonished': '[face_shocked]',
	'neutral_face': '[face_plain]',
	'nauseated_face': '[face_sick]',
	'roll_eyes': '[face_rolleyes]',
	'resetti': '[ac_resetti]',
	'blanca': '[ac_blanca]',
	'gyroid': '[ac_gyroid]',
	'serena': '[ac_serena]',
	'kk': '[ac_kk]',
	'nat': '[ac_nat]',
	'owner': '[acc_owner]',
	'admin': '[acc_admin]',
	'mod': '[acc_mod]',
	'scout': '[acc_scout]',
	'researcher': '[acc_researcher]',
	'dev': '[acc_dev]',
	'hc': '[acc_hc]',
	'birthday': '[acc_birthday]',
	'newbie': '[acc_newbie]',
	'buddy': '[acc_buddy]',
	'unflag': '[acc_flag_green]',
	'flag': '[acc_flag]',
	'edit': '[acc_edit]',
	'message': '[acc_message]',
	'report': '[acc_report]',
	'idea': '[acc_idea]',
	'trade': '[acc_trade]',
	'wifi': '[acc_wifi]',
	'lock': '[acc_locked]',
	'sticky': '[acc_sticky]',
	'help_button': '[acc_help]',
	'feedback_positive': '[acc_positive]',
	'feedback_negative': '[acc_negative]',
	'feedback_neutral': '[acc_neutral]',
};

function parsePlaintext(text: string): string
{
	// First remove dangerous characters
	text = escapeHtml(text);

	// Then replace spaces and newlines with non-breaking spaces and <br> tags,
	// to preserve the user's whitespace.
	// We can't do both steps at once because otherwise the tags we insert would
	// themselves be escaped as we go along.
	text = text.replace(/(  +|\r?\n)/g,
		function(match)
		{
			if (match === '\n' || match === '\r\n')
			{
				return '<br>';
			}
			else
			{
				let spaces = '';
				for (let i = 0; i < match.length; i++)
				{
					spaces += '&nbsp;';
				}
				return spaces;
			}
		},
	);

	// And finally, put it all in a <p> so that typography styles get applied.
	return `<p>${text}</p>`;
}

// This is the only function that is actually called from outside this file
// "text" is a string containing markup; "format" 
// valid values for "format" are:
//	- 'plaintext' (actually any unsupported value will resolve to this)
//	- 'bbcode'
//	- 'bbcode+html'
//	- 'markdown'
//	- 'markdown+html'
// - emojiSettings: user emoji settings, for gendered emojis
export function parse({ text, format, emojiSettings, currentUser }: { text: string, format: MarkupFormatType, emojiSettings: EmojiSettingType[] | undefined, currentUser: UserType | null })
{
	if (format === 'markdown')
	{
		return parseMarkdown(text, emojiSettings, currentUser);
	}
	else if (format === 'markdown+html')
	{
		return parseMarkdown(text, emojiSettings, currentUser, true);
	}
	else if (format === 'bbcode')
	{
		return parseBbcode(text, {
			emojiSettings: emojiSettings,
			currentUser: currentUser,
		});
	}
	else if (format === 'bbcode+html')
	{
		return parseBbcode(text, {
			emojiSettings: emojiSettings,
			currentUser: currentUser,
		}, true);
	}
	else
	{
		return parsePlaintext(text);
	}
}
