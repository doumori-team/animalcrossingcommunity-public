/* eslint-disable @typescript-eslint/no-explicit-any */
import MarkdownIt from 'markdown-it';
import ins from 'markdown-it-ins';
import spoiler from '@traptitech/markdown-it-spoiler';
import attrs from 'markdown-it-attrs';
import { full as emoji } from 'markdown-it-emoji';

import color from './markdown-color.ts';
import emojiDefs from 'common/markup/emoji.json';
import userTag from './markdown-user-tag.ts';
import center from './markdown-center.ts';
import poll from './markdown-poll.ts';
import { constants } from '@utils';
import { UserType, EmojiSettingType, NodeChildNodesType, UserPollType } from '@types';

const parserEmojiDef = {
	defs: { ...emojiDefs[0], ...emojiDefs[1] },
	shortcuts: {
		'smile': [ ':)', '<:)' ],
		'frowning_face': [ ':(', '<:(' ],
		'grin': [ ':D', '<:D' ],
		'smiling_face_with_two_hearts': [ ':x', '<:x' ],
		'shifty': [ ';\\', '<;\\' ],
		'sunglasses': [ 'B-)', '<B-)' ],
		'smiling_imp': [ ']:)', '<]:)' ],
		'stuck_out_tongue': [ ':p', '<:p', ':P', '<:P' ],
		'rage': [ 'X-(', '<X-(' ],
		'laughing': [ ':^O', '<:^O' ],
		'wink': [ ';)', '<;)' ],
		'blush': [ ':8}', '<:8}' ],
		'cry': [ ':_|', '<:_|' ],
		'confused': [ '?:|', '<?:|' ],
		'astonished': [ ':O', '<:O' ],
		'neutral_face': [ ':|', '<:|' ],
		'nauseated_face': [ ':&', '<:&' ],
		'roll_eyes': [ ":'", "<:'" ],
		'resetti': [ '(X0' ],
		'blanca': [ ':#' ],
		'gyroid': [ '{|=0' ],
		'serena': [ '{=]' ],
		'kk': [ ':-o~' ],
		'nat': [ '8-P' ],
	},
};

function createParser(currentUser: UserType | null, nodeQuotes?: NodeChildNodesType['nodeQuotes'], pageLink?: string, polls?: UserPollType[], html = false): MarkdownIt
{
	const parser = new MarkdownIt({
		html: html, // HTML tags
		breaks: true, // Preserve line breaks added by the user
		linkify: true, // Autoconvert URLs to links
		typographer: true, // Beautification of quote marks and dashes
	});

	parser.use(ins); // Plugin: adds ++ tags (for underlining)
	parser.use(spoiler); // Plugin: adds !! tags (for spoilers)
	parser.use(color); // Plugin (our own): adds {color} tags
	parser.use(emoji, parserEmojiDef); // Plugin: add emoji
	parser.use(center); // Plugin (our own): auto-center text
	parser.use(poll, { polls }); // Plugin (our own): interactive poll

	if (html)
	{
		parser.enable('image');
		parser.use(attrs); // Plugin: adds attributes (id, class, etc.)
	}
	else
	{
		parser.disable('image'); // Disable embedded images
	}

	if (currentUser)
	{
		parser.use(userTag); // Plugin (our own): adds @username tag
	}

	// adds link to post to quote
	parser.core.ruler.push('quote_links', (state) =>
	{
		const tokens = state.tokens;
		let currentQuoteOrder = 0;

		for (let i = 0; i < tokens.length; i++)
		{
			const token = tokens[i];

			if (token.type === 'blockquote_open')
			{
				currentQuoteOrder += 1;
				const quoteMatch = nodeQuotes?.find(q => q.sortOrder === currentQuoteOrder);

				const divOpen = new state.Token('html_block', '', 0);
				divOpen.content = `<div>`;
				tokens.splice(i + 1, 0, divOpen);

				let j = i + 2;
				while (j < tokens.length && tokens[j].type !== 'blockquote_close') j++;

				const divClose = new state.Token('html_block', '', 0);
				divClose.content = `</div>`;
				tokens.splice(j, 0, divClose);

				if (quoteMatch && pageLink)
				{
					const htmlToken = new state.Token('html_block', '', 0);
					htmlToken.content = `<a href="${pageLink}/${encodeURIComponent(quoteMatch.page)}#${encodeURIComponent(quoteMatch.nodeId)}" class="quote-link"><svg class="FontAwesomeIcon" aria-label="Up" viewBox="0 0 640 640"><path d="M320 112C434.9 112 528 205.1 528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM331.3 188.7C325.1 182.5 314.9 182.5 308.7 188.7L204.7 292.7C200.1 297.3 198.8 304.2 201.2 310.1C203.6 316 209.5 320 216 320L288 320L288 424C288 437.3 298.7 448 312 448L328 448C341.3 448 352 437.3 352 424L352 320L424 320C430.5 320 436.3 316.1 438.8 310.1C441.3 304.1 439.9 297.2 435.3 292.7L331.3 188.7z"/>Up</svg></a>`;

					tokens.splice(j + 1, 0, htmlToken);

					i = j + 1;
				}
			}
		}
	});

	if (!html)
	{
		const defaultRender = parser.renderer.rules.link_open || function(tokens: any, idx: any, options: any, env: any, self: any)
		{
			return self.renderToken(tokens, idx, options);
		};

		parser.renderer.rules.link_open = function(tokens: any, idx: any, options: any, env: any, self: any): string
		{
			let hIndex = tokens[idx].attrIndex('href');

			if (tokens[idx].attrs[hIndex][1].startsWith('Topic/') || tokens[idx].attrs[hIndex][1].startsWith('forums/'))
			{
				tokens[idx].attrs[hIndex][1] = `/${tokens[idx].attrs[hIndex][1]}`;
			}
			else if (tokens[idx].attrs[hIndex][1].startsWith('www'))
			{
				tokens[idx].attrs[hIndex][1] = `http://${tokens[idx].attrs[hIndex][1]}`;
			}

			tokens[idx].attrs[hIndex][1] = `/leaving?url=${tokens[idx].attrs[hIndex][1]}`;

			return defaultRender(tokens, idx, options, env, self);
		};
	}

	return parser;
}


export default function parse(text: string, emojiSettings: EmojiSettingType[] | undefined, currentUser: UserType | null, nodeQuotes?: NodeChildNodesType['nodeQuotes'], pageLink?: string, polls?: UserPollType[], html = false): string
{
	const parser = createParser(currentUser, nodeQuotes, pageLink, polls, html);

	function renderEmoji(token: any, idx: any): string
	{
		const emoji = token[idx];

		let src = '', className = '';
		const setting = emojiSettings?.find(s => s.type === emoji.markup);

		if (setting)
		{
			src = `${setting.category}/`;
		}
		else if (Object.keys(emojiDefs[0]).includes(emoji.markup))
		{
			src = `reaction/`;
		}

		if (src.includes('reaction'))
		{
			className = 'icon-reaction';
		}

		return `<img class="${className}" src="${
			constants.allImages[
    			`emoji/${src}${emoji.content}.png`
			]
		}" />`;
	}

	parser.renderer.rules.emoji = renderEmoji;

	return parser.render(text);
}
