import MarkdownIt from 'markdown-it';
import ins from 'markdown-it-ins';
import spoiler from '@traptitech/markdown-it-spoiler';
import color from './markdown-color.js';
import attrs from 'markdown-it-attrs';
import emoji from 'markdown-it-emoji';
import emojiDefs from 'common/markup/emoji.json' assert { type: 'json'};
import userTag from './markdown-user-tag.js';
import center from './markdown-center.js';

const parserEmojiDef = {
	defs: { ...emojiDefs[0], ...emojiDefs[1] },
	shortcuts: {
		"smile": [ ":)", "<:)" ],
		"frowning_face": [ ":(", "<:(" ],
		"grin": [ ":D", "<:D" ],
		"smiling_face_with_two_hearts": [ ":x", "<:x" ],
		"shifty": [ ";\\", "<;\\" ],
		"sunglasses": [ "B-)", "<B-)" ],
		"smiling_imp": [ "]:)", "<]:)" ],
		"stuck_out_tongue": [ ":p", "<:p", ":P", "<:P" ],
		"rage": [ "X-(", "<X-(" ],
		"laughing": [ ":^O", "<:^O" ],
		"wink": [ ";)", "<;)" ],
		"blush": [ ":8}", "<:8}" ],
		"cry": [ ":_|", "<:_|" ],
		"confused": [ "?:|", "<?:|" ],
		"astonished": [ ":O", "<:O" ],
		"neutral_face": [ ":|", "<:|" ],
		"nauseated_face": [ ":&", "<:&" ],
		"roll_eyes": [ ":'", "<:'" ],
		"resetti": [ "(X0" ],
		"blanca": [ ":#" ],
		"gyroid": [ "{|=0" ],
		"serena": [ "{=]" ],
		"kk": [ ":-o~" ],
		"nat": [ "8-P" ]
	},
}

const parser = new MarkdownIt({
	html: false, // Disable HTML tags
	breaks: true, // Preserve line breaks added by the user
	linkify: true, // Autoconvert URLs to links
	typographer: true // Beautification of quote marks and dashes
});
parser.disable('image'); // Disable embedded images (hard to moderate)
parser.use(ins); // Plugin: adds ++ tags (for underlining)
parser.use(spoiler); // Plugin: adds !! tags (for spoilers)
parser.use(color); // Plugin (our own): adds {color} tags
parser.use(emoji, parserEmojiDef); // Plugin: add emoji
parser.use(userTag); // Plugin (our own): adds @username tag
parser.use(center); // Plugin (our own): auto-center text

var defaultRender = parser.renderer.rules.link_open || function(tokens, idx, options, env, self)
{
	return self.renderToken(tokens, idx, options);
};

parser.renderer.rules.link_open = function(tokens, idx, options, env, self)
{
	var hIndex = tokens[idx].attrIndex('href');

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

// Create html parser
const htmlParser = new MarkdownIt({
	html: true,
	breaks: true,
	linkify: true,
	typographer: true
});
htmlParser.enable('image');
htmlParser.use(ins);
htmlParser.use(spoiler);
htmlParser.use(color);
htmlParser.use(emoji, parserEmojiDef);
htmlParser.use(userTag);
htmlParser.use(attrs); // Plugin: adds attributes (id, class, etc.)

export default function parse(text, emojiSettings, html = false)
{
	function renderEmoji(token, idx)
	{
		const emoji = token[idx];

		let src = '';
		const setting = emojiSettings?.find(s => s.type === emoji.markup);

		if (setting)
		{
			src = `${setting.category}/`;
		}
		else if (Object.keys(emojiDefs[0]).includes(emoji.markup))
		{
			src = `reaction/`;
		}

		return `<img src='${process.env.AWS_URL}/images/emoji/${src}${emoji.content}.png' />`;
	}

	if (html)
	{
		htmlParser.renderer.rules.emoji = renderEmoji;

		return htmlParser.render(text);
	}

	parser.renderer.rules.emoji = renderEmoji;

	return parser.render(text);
}
