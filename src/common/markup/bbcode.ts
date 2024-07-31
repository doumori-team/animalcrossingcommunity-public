import { escapeHtml, stringAt } from './utils.ts';
import emojiDefs from 'common/markup/emoji.json' assert { type: 'json'};
import { convertForUrl } from 'common/utils/utils.ts';
import * as constants from 'common/utils/constants.ts';
import { regexes } from 'common/utils/constants.ts';
import { EmojiSettingType, UserType } from '@types';

type BBCodeThisType = {
	currentUser: UserType|null
	emojiSettings: EmojiSettingType[]|undefined
}

const TOKENS = {
	PLAINTEXT: Symbol('plaintext'),
	DOUBLE_SPACE: Symbol('double_space'),
	LINE_BREAK: Symbol('line_break'),
	BOLD_START: Symbol('bold_start'),
	BOLD_END: Symbol('bold_end'),
	ITALIC_START: Symbol('italic_start'),
	ITALIC_END: Symbol('italic_end'),
	UNDERLINE_START: Symbol('underline_start'),
	UNDERLINE_END: Symbol('underline_end'),
	STRIKE_START: Symbol('strike_start'),
	STRIKE_END: Symbol('strike_end'),
	BLOCKQUOTE_START: Symbol('blockquote_start'),
	BLOCKQUOTE_END: Symbol('blockquote_end'),
	BLOCK_START: Symbol('block_start'),
	BLOCK_END: Symbol('block_end'),
	HORIZONTAL_RULE: Symbol('horizontal_rule'),
	LINK_START: Symbol('link_start'),
	LINK_END: Symbol('link_end'),
	COLOUR_START: Symbol('colour_start'),
	COLOUR_END: Symbol('colour_end'),
	SPOILER_START: Symbol('spoiler_start'),
	SPOILER_END: Symbol('spoiler_end'),
	USER_TAG: Symbol('user_tag'),
	CODE_START: Symbol('code_start'),
	CODE_END: Symbol('code_end'),
	// EMOTES START
	FROWNING_FACE: 'frowning_face',
	GRIN: 'grin',
	SMILING_FACE_WITH_TWO_HEARTS: 'smiling_face_with_two_hearts',
	SHIFTY: 'shifty',
	SUNGLASSES: 'sunglasses',
	SMILING_IMP: 'smiling_imp',
	STUCK_OUT_TONGUE: 'stuck_out_tongue',
	RAGE: 'rage',
	LAUGHING: 'laughing',
	WINK: 'wink',
	BLUSH: 'blush',
	CRY: 'cry',
	CONFUSED: 'confused',
	ASTONISHED: 'astonished',
	NEUTRAL_FACE: 'neutral_face',
	NAUSEATED_FACE: 'nauseated_face',
	ROLL_EYES: 'roll_eyes',
	SMILE: 'smile',
	RESETTI: 'resetti',
	BLANCA: 'blanca',
	GYROID: 'gyroid',
	SERENA: 'serena',
	KK: 'kk',
	NAT: 'nat',
	OWNER: 'owner',
	ADMIN: 'admin',
	MOD: 'mod',
	SCOUT: 'scout',
	RESEARCHER: 'researcher',
	DEV: 'dev',
	HC: 'hc',
	BIRTHDAY: 'birthday',
	NEWBIE: 'newbie',
	BUDDY: 'buddy',
	UNFLAG: 'unflag',
	FLAG: 'flag',
	EDIT: 'edit',
	MESSAGE: 'message',
	REPORT: 'report',
	IDEA: 'idea',
	TRADE: 'trade',
	WIFI: 'wifi',
	LOCK: 'lock',
	STICKY: 'sticky',
	HELP_BUTTON: 'help_button',
	FEEDBACK_POSITIVE: 'feedback_positive',
	FEEDBACK_NEGATIVE: 'feedback_negative',
	FEEDBACK_NEUTRAL: 'feedback_neutral',
}

const LEXEMES = {
	// The specification here that the match for spaces should be case-insensitive is a holdover from ACC1.
	// It doesn't actually do anything, obviously, but I think it's hilarious.
	[TOKENS.DOUBLE_SPACE]: /  /i,
	[TOKENS.LINE_BREAK]: /\r?\n/,
	[TOKENS.BOLD_START]: /\[b\]/,
	[TOKENS.BOLD_END]: /\[\/b\]/,
	[TOKENS.ITALIC_START]: /\[i\]/,
	[TOKENS.ITALIC_END]: /\[\/i\]/,
	[TOKENS.UNDERLINE_START]: /\[u\]/,
	[TOKENS.UNDERLINE_END]: /\[\/u\]/,
	[TOKENS.STRIKE_START]: /\[s\]/,
	[TOKENS.STRIKE_END]: /\[\/s\]/,
	[TOKENS.BLOCKQUOTE_START]: /\[(?:blockquote|bq)\]/,
	[TOKENS.BLOCKQUOTE_END]: /\[\/(?:blockquote|bq)\]/,
	[TOKENS.BLOCK_START]: /\[bl\]/,
	[TOKENS.BLOCK_END]: /\[\/bl\]/,
	[TOKENS.HORIZONTAL_RULE]: /\[hr\](?:\[\/hr\])?/,
	[TOKENS.LINK_START]: /\[link=([^\[]*)\]/,
	[TOKENS.LINK_END]: /\[\/link\]/,
	[TOKENS.COLOUR_START]: /\[colou?r=([^\[]*)\]/,
	[TOKENS.COLOUR_END]: /\[\/colou?r\]/,
	[TOKENS.SPOILER_START]: /\[spoiler\]/,
	[TOKENS.SPOILER_END]: /\[\/spoiler\]/,
	[TOKENS.USER_TAG]: RegExp(regexes.userTag),
	[TOKENS.CODE_START]: /\[code\]/,
	[TOKENS.CODE_END]: /\[\/code\]/,
	// EMOTES START
	[TOKENS.SMILE]: /:\)|\<:\)|\[face_happy\]|\[fface_happy\]/,
	[TOKENS.FROWNING_FACE]: /:\(|\<:\(|\[face_sad\]|\[fface_sad\]/,
	[TOKENS.GRIN]: /:D|\<:D|\[face_grin\]|\[fface_grin\]/,
	[TOKENS.SMILING_FACE_WITH_TWO_HEARTS]: /:x|\<:x|\[face_love\]|\[fface_love\]/,
	[TOKENS.SHIFTY]: /;\\|\<;\\|\[face_mischief\]|\[fface_mischief\]/,
	[TOKENS.SUNGLASSES]: /B-\)|\<B-\)|\[face_cool\]|\[fface_cool\]/,
	[TOKENS.SMILING_IMP]: /]:\)|\<]:\)|\[face_devil\]|\[fface_devil\]/,
	[TOKENS.STUCK_OUT_TONGUE]: /:p|\<:p|\:P|\<:P|\[face_silly\]|\[fface_silly\]/,
	[TOKENS.RAGE]: /X-\(|\<X-\(|\[face_angry\]|\[fface_angry\]/,
	[TOKENS.LAUGHING]: /:\^O|\<:\^O|\[face_laugh\]|\[fface_laugh\]/,
	[TOKENS.WINK]: /;\)|\<;\)|\[face_wink\]|\[fface_wink\]/,
	[TOKENS.BLUSH]: /:8}|\<:8}|\[face_blush\]|\[fface_blush\]/,
	[TOKENS.CRY]: /:_\||\<:_\||\[face_cry\]|\[fface_cry\]/,
	[TOKENS.CONFUSED]: /\?:\||\<\?:\||\[face_confused\]|\[fface_confused\]/,
	[TOKENS.ASTONISHED]: /:O|\<:O|\[face_shocked\]|\[fface_shocked\]/,
	[TOKENS.NEUTRAL_FACE]: /:\||\<:\||\[face_plain\]|\[fface_plain\]/,
	[TOKENS.NAUSEATED_FACE]: /:&|\<:&|\[face_sick\]|\[fface_sick\]/,
	[TOKENS.ROLL_EYES]: /:'|\<:'|\[face_rolleyes\]|\[fface_rolleyes\]/,
	[TOKENS.RESETTI]: /\(X0|\[ac_resetti\]/,
	[TOKENS.BLANCA]: /:#|\[ac_blanca\]/,
	[TOKENS.GYROID]: /{\|=0|\[ac_gyroid\]/,
	[TOKENS.SERENA]: /{=]|\[ac_serena\]/,
	[TOKENS.KK]: /:-o~|\[ac_kk\]/,
	[TOKENS.NAT]: /8-P|\[ac_nat\]/,
	[TOKENS.OWNER]: /\[acc_owner\]/,
	[TOKENS.ADMIN]: /\[acc_admin\]/,
	[TOKENS.MOD]: /\[acc_mod\]/,
	[TOKENS.SCOUT]: /\[acc_scout\]/,
	[TOKENS.RESEARCHER]: /\[acc_researcher\]/,
	[TOKENS.DEV]: /\[acc_dev\]/,
	[TOKENS.HC]: /\[acc_hc\]/,
	[TOKENS.BIRTHDAY]: /\[acc_birthday\]/,
	[TOKENS.NEWBIE]: /\[acc_newbie\]/,
	[TOKENS.BUDDY]: /\[acc_buddy\]/,
	[TOKENS.UNFLAG]: /\[acc_flag_green\]/,
	[TOKENS.FLAG]: /\[acc_flag\]/,
	[TOKENS.EDIT]: /\[acc_edit\]/,
	[TOKENS.MESSAGE]: /\[acc_message\]/,
	[TOKENS.REPORT]: /\[acc_report\]/,
	[TOKENS.IDEA]: /\[acc_idea\]/,
	[TOKENS.TRADE]: /\[acc_trade\]/,
	[TOKENS.WIFI]: /\[acc_wifi\]/,
	[TOKENS.LOCK]: /\[acc_locked\]/,
	[TOKENS.STICKY]: /\[acc_sticky\]/,
	[TOKENS.HELP_BUTTON]: /\[acc_help\]/,
	[TOKENS.FEEDBACK_POSITIVE]: /\[acc_positive\]/,
	[TOKENS.FEEDBACK_NEGATIVE]: /\[acc_negative\]/,
	[TOKENS.FEEDBACK_NEUTRAL]: /\[acc_neutral\]/,
}

// The parameters to these functions are the same as the yield values of *lexer()
// (other than the token ID itself).
// `this` is populated with the values of the options passed to the main parser function
const PARSERS = {
	[TOKENS.DOUBLE_SPACE]: () => '&nbsp;&nbsp;',
	[TOKENS.LINE_BREAK]: () => '<br>',
	[TOKENS.BOLD_START]: () => '<strong>',
	[TOKENS.BOLD_END]: () => '</strong>',
	[TOKENS.ITALIC_START]: () => '<em>',
	[TOKENS.ITALIC_END]: () => '</em>',
	[TOKENS.UNDERLINE_START]: () => '<ins>',
	[TOKENS.UNDERLINE_END]: () => '</ins>',
	[TOKENS.STRIKE_START]: () => '<del>',
	[TOKENS.STRIKE_END]: () => '</del>',
	[TOKENS.BLOCKQUOTE_START]: () => '<blockquote>&ldquo;',
	[TOKENS.BLOCKQUOTE_END]: () => '&rdquo;</blockquote>',
	[TOKENS.BLOCK_START]: () => '<blockquote>',
	[TOKENS.BLOCK_END]: () => '</blockquote>',
	[TOKENS.HORIZONTAL_RULE]: () => '<hr>',
	[TOKENS.LINK_START]: (_:any, url:string) => {
		if (!url)
		{
			return '';
		}

		if (url.startsWith('Topic/') || url.startsWith('forums/'))
		{
			url = `/${url}`;
		}
		else if (url.startsWith('www'))
		{
			url = `http://${url}`;
		}

		return `<a href="/leaving?url=${url}">`;
	},
	[TOKENS.LINK_END]: () => '</a>',
	[TOKENS.COLOUR_START]: (_:any, color:string) => `<font color="${color}">`,
	[TOKENS.COLOUR_END]: () => '</font>',
	[TOKENS.SPOILER_START]: () => '<span class="spoiler">',
	[TOKENS.SPOILER_END]: () => '</span>',
	[TOKENS.USER_TAG]: function (_:any, username:string) {
		if (this.currentUser)
		{
			return `<a href="/profile/${convertForUrl(username)}">@${username}</a>`;
		}

		return `@${username}`;
	},
	[TOKENS.CODE_START]: () => '',
	[TOKENS.CODE_END]: () => '',
	// EMOTES START
	[TOKENS.SMILE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SMILE); },
	[TOKENS.FROWNING_FACE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.FROWNING_FACE); },
	[TOKENS.GRIN]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.GRIN); },
	[TOKENS.SMILING_FACE_WITH_TWO_HEARTS]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SMILING_FACE_WITH_TWO_HEARTS); },
	[TOKENS.SHIFTY]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SHIFTY); },
	[TOKENS.SUNGLASSES]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SUNGLASSES); },
	[TOKENS.SMILING_IMP]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SMILING_IMP); },
	[TOKENS.STUCK_OUT_TONGUE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.STUCK_OUT_TONGUE); },
	[TOKENS.RAGE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.RAGE); },
	[TOKENS.LAUGHING]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.LAUGHING); },
	[TOKENS.WINK]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.WINK); },
	[TOKENS.BLUSH]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.BLUSH); },
	[TOKENS.CRY]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.CRY); },
	[TOKENS.CONFUSED]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.CONFUSED); },
	[TOKENS.ASTONISHED]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.ASTONISHED); },
	[TOKENS.NEUTRAL_FACE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.NEUTRAL_FACE); },
	[TOKENS.NAUSEATED_FACE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.NAUSEATED_FACE); },
	[TOKENS.ROLL_EYES]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.ROLL_EYES); },
	[TOKENS.RESETTI]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.RESETTI); },
	[TOKENS.BLANCA]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.BLANCA); },
	[TOKENS.GYROID]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.GYROID); },
	[TOKENS.SERENA]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SERENA); },
	[TOKENS.KK]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.KK); },
	[TOKENS.NAT]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.NAT); },
	[TOKENS.OWNER]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.OWNER); },
	[TOKENS.ADMIN]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.ADMIN); },
	[TOKENS.MOD]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.MOD); },
	[TOKENS.SCOUT]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.SCOUT); },
	[TOKENS.RESEARCHER]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.RESEARCHER); },
	[TOKENS.DEV]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.DEV); },
	[TOKENS.HC]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.HC); },
	[TOKENS.BIRTHDAY]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.BIRTHDAY); },
	[TOKENS.NEWBIE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.NEWBIE); },
	[TOKENS.BUDDY]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.BUDDY); },
	[TOKENS.UNFLAG]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.UNFLAG); },
	[TOKENS.FLAG]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.FLAG); },
	[TOKENS.EDIT]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.EDIT); },
	[TOKENS.MESSAGE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.MESSAGE); },
	[TOKENS.REPORT]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.REPORT); },
	[TOKENS.IDEA]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.IDEA); },
	[TOKENS.TRADE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.TRADE); },
	[TOKENS.WIFI]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.WIFI); },
	[TOKENS.LOCK]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.LOCK); },
	[TOKENS.STICKY]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.STICKY); },
	[TOKENS.HELP_BUTTON]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.HELP_BUTTON); },
	[TOKENS.FEEDBACK_POSITIVE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.FEEDBACK_POSITIVE); },
	[TOKENS.FEEDBACK_NEGATIVE]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.FEEDBACK_NEGATIVE); },
	[TOKENS.FEEDBACK_NEUTRAL]: function (this: BBCodeThisType) { return getEmojiSrc(this.emojiSettings, TOKENS.FEEDBACK_NEUTRAL); },
}

const TAG_PAIRINGS = new Map([
	[TOKENS.BOLD_END, TOKENS.BOLD_START],
	[TOKENS.ITALIC_END, TOKENS.ITALIC_START],
	[TOKENS.UNDERLINE_END, TOKENS.UNDERLINE_START],
	[TOKENS.STRIKE_END, TOKENS.STRIKE_START],
	[TOKENS.BLOCKQUOTE_END, TOKENS.BLOCKQUOTE_START],
	[TOKENS.BLOCK_END, TOKENS.BLOCK_START],
	[TOKENS.LINK_END, TOKENS.LINK_START],
	[TOKENS.COLOUR_END, TOKENS.COLOUR_START],
	[TOKENS.SPOILER_END, TOKENS.SPOILER_START],
	[TOKENS.CODE_END, TOKENS.CODE_START],
]);

const PAIRED_TAGS = [...TAG_PAIRINGS.values()];

// This generator loops over the input string and yields, in order, the lexical tokens that make it up.
// The tokens are arrays matching the following format:
//	- The first element is the ID of the token from the TOKENS dict above
//	- The second element is the original markup that was matched to the token
//	- The remaining elements, if any, are the contents of substring matches in the lexeme regex
// For example:
// [TOKENS.PLAINTEXT, 'abc']
// [TOKENS.BOLD_START, '[b]']
// [TOKENS.LINK_START, '[link=https://example.com/]', 'https://example.com/']
// These arrays are used as arguments to the parser functions above.
function *lexer(text:string)
{
	let unmatched = '';
	const tokenCount = {}; // State used to keep track of opening/closing tags and insert missing ones
	let ignoringBreaks = false; // State used to ignore line breaks immediately after a closing [/bq]

	for (var i = 0; i < text.length; i++)
	{
		const char = text.charAt(i);

		if (char === undefined)
		{
			break;
		}

		unmatched += char;

		// Take the characters that haven't been matched to a token yet,
		// and compare them to each one in turn.
		for (const token of Object.values(TOKENS))
		{
			// If we are within [code] tags, allow only [code] and [/code]
			// (Also allow preservation of whitespace)
			if ((tokenCount as any)[TOKENS.CODE_START] > 0
				&& token !== TOKENS.CODE_END && token !== TOKENS.CODE_START
				&& token !== TOKENS.DOUBLE_SPACE && token !== TOKENS.LINE_BREAK)
			{
				continue;
			}

			// If the token has no associated regex, skip it
			const lexeme = LEXEMES[token];

			if (!lexeme)
			{
				continue;
			}

			const matches = unmatched.match(lexeme);

			if (matches && token === TOKENS.USER_TAG)
			{
				if (!unmatched.match(RegExp(regexes.userTag2)))
				{
					continue;
				}
			}

			if (matches)
			{
				let endIsNonWordChar = null, lastCharacter:string|undefined = '';

				if (token === TOKENS.USER_TAG)
				{
					lastCharacter = stringAt(unmatched, -1);
					endIsNonWordChar = (lastCharacter as any).match(/\W/g);

					// we go character by character;
					// don't confirm match until we detect the end of the string
					if (!endIsNonWordChar)
					{
						// if text hasn't ended yet, check if we're at the end of the text
						if ((i+1) !== text.length)
						{
							// we aren't, keep matching
							break;
						}
						// we finished the text, so match what we have
					}
				}

				// We found a token!

				// If it's a starting tag, add it to the count
				if (PAIRED_TAGS.indexOf(token as any) > -1)
				{
					(tokenCount as any)[token] = ((tokenCount as any)[token] || 0) + 1;
				}

				// If there are unmatched characters before the token,
				// they are plain text.
				if ((matches as any).index > 0)
				{
					yield [TOKENS.PLAINTEXT, unmatched.slice(0, matches.index)];
					ignoringBreaks = false;
				}

				unmatched = '';

				// If the token is an end tag, check whether there is an unclosed start tag to pair it to.
				if (TAG_PAIRINGS.get(token as any))
				{
					const unclosedStartTags = (tokenCount as any)[TAG_PAIRINGS.get(token as any) as any];

					// If there isn't, insert one.
					if (unclosedStartTags === 0 || isNaN(unclosedStartTags))
					{
						yield [TAG_PAIRINGS.get(token as any), ''];
					}
					// If there is, decrement the count of unmatched start tags.
					else
					{
						(tokenCount as any)[TAG_PAIRINGS.get(token as any) as any]--;
					}
				}

				// Drop any line breaks that occur after we start ignoring line breaks
				if (ignoringBreaks)
				{
					if (token === TOKENS.LINE_BREAK)
					{
						break;
					}
					else
					{
						ignoringBreaks = false;
					}
				}

				// If the token is [/blockquote], [/bq] or [/bl], start ignoring line breaks
				if (token === TOKENS.BLOCKQUOTE_END || token === TOKENS.BLOCK_END)
				{
					ignoringBreaks = true;
				}

				// Return the matched token and move on the the next character
				yield [token, ...matches];

				// if user tag, we matched on name, but need to append the ending character
				if (token === TOKENS.USER_TAG && endIsNonWordChar)
				{
					yield [TOKENS.PLAINTEXT, lastCharacter];
				}

				break;
			}
		}
	}

	// The remaining unmatched text is obviously plaintext
	if (unmatched.length > 0)
	{
		yield [TOKENS.PLAINTEXT, unmatched];
	}

	// Add any missing closing tags
	for (const token of TAG_PAIRINGS.keys())
	{
		for (let i = 0; i < (tokenCount as any)[TAG_PAIRINGS.get(token as any) as any]; i++)
		{
			yield [token, ''];
		}
	}
}

function getEmojiSrc(emojiSettings: EmojiSettingType[]|undefined, markup:any) : string
{
	const defs = { ...emojiDefs[0], ...emojiDefs[1] };

	let src = '';
	const setting = emojiSettings?.find(s => s.type === markup);

	if (setting)
	{
		src = `${setting.category}/`;
	}
	else if (Object.keys(emojiDefs[0]).includes(markup))
	{
		src = `reaction/`;
	}

	return `<img src='${constants.AWS_URL}/images/emoji/${src}${(defs as any)[markup]}.png' />`;
}

export default function parser(input:any, options:any, html:any = false)
{
	const output = [];

	for (let [token, ...matches] of lexer(input))
	{
		output.push(PARSERS[token as any] ? PARSERS[token as any].apply(options, matches as any) : (html ? matches[0] : escapeHtml((matches as any)[0])));
	}

	return output.join('');
}
