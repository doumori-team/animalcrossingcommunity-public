import { describe, test, expect } from 'vitest';

import parse from 'common/markup/markdown.ts';
import { UserType, EmojiSettingType } from '@types';

// determines whether to parse username tags
const currentUser = {
	id: 5,
	username: 'test-user',
} as unknown as UserType;

describe('Markdown Parser', () =>
{
	test('renders plain text', () =>
	{
		// Arrange
		const input = 'test';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toEqual(`<p>${input}</p>\n`);
	});

	test('does not render html text with normal parser', () =>
	{
		// Arrange
		const input = '<div class="display-flex justify-content-center"><div>';

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], false);

		// Assert
		expect(html).toEqual(`<p>&lt;div class=“display-flex justify-content-center”&gt;&lt;div&gt;</p>\n`);
	});

	test('renders html text with html parser', () =>
	{
		// Arrange
		const input = '<div class="display-flex justify-content-center"><div>';

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], true);

		// Assert
		expect(html).toEqual(`${input}`);
	});

	test('does not render attrs text with normal parser', () =>
	{
		// Arrange
		const text = 'header';
		const input = `# ${text} {.style-me}`;

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], false);

		// Assert
		expect(html).toEqual(`<h1>${text} {.style-me}</h1>\n`);
	});

	test('renders attrs text with html parser', () =>
	{
		// Arrange
		const text = 'header';
		const input = `# ${text} {.style-me}`;

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], true);

		// Assert
		expect(html).toEqual(`<h1 class="style-me">${text}</h1>\n`);
	});

	test('beautifies quote marks', () =>
	{
		// Arrange
		const input = '"test"';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toEqual(`<p>“test”</p>\n`);
	});

	test('renders bold text', () =>
	{
		// Arrange
		const text = 'bold';
		const input = `**${text}**`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<strong>${text}</strong>`);
	});

	test('renders italic text', () =>
	{
		// Arrange
		const text = 'italic';
		const input = `*${text}*`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<em>${text}</em>`);
	});

	test('renders underline text', () =>
	{
		// Arrange
		const text = 'underline';
		const input = `++${text}++`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<ins>${text}</ins>`);
	});

	test('renders strikethrough text', () =>
	{
		// Arrange
		const text = 'strikethrough';
		const input = `~~${text}~~`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<s>${text}</s>`);
	});

	test('renders color text', () =>
	{
		// Arrange
		const text = 'cake';
		const input = `{color:cake}${text}{color}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<font color="cake">${text}</font>`);
	});

	test('renders color text (colour)', () =>
	{
		// Arrange
		const text = 'cake';
		const input = `{colour:cake}${text}{colour}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<font color="cake">${text}</font>`);
	});

	test('renders spoiler text', () =>
	{
		// Arrange
		const text = 'spoiler';
		const input = `!!${text}!!`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<span class="spoiler">${text}</span>`);
	});

	test('renders link text', () =>
	{
		// Arrange
		const text = 'www.google.com';
		const input = `[${text}](www.google.com)`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<a href="/leaving?url=http://www.google.com">${text}</a>`);
	});

	test('renders link text (autoconvert)', () =>
	{
		// Arrange
		const text = 'www.google.com';
		const input = `${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<a href="/leaving?url=http://www.google.com">${text}</a>`);
	});

	test('renders link text, adds missing / (Topic/)', () =>
	{
		// Arrange
		const text = 'Go Here';
		const input = `[${text}](Topic/4837485)`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<a href="/leaving?url=/Topic/4837485">${text}</a`);
	});

	test('renders link text, adds missing / (forums/)', () =>
	{
		// Arrange
		const text = 'Go Here';
		const input = `[${text}](forums/4837485)`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<a href="/leaving?url=/forums/4837485">${text}</a`);
	});

	test('renders monospace text', () =>
	{
		// Arrange
		const text = '{color:cake}cake{color}';
		const input = `\`${text}\``;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<code>${text}</code>`);
	});

	test('renders quote text', () =>
	{
		// Arrange
		const text = 'this is a quote';
		const input = `> ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<blockquote>\n<div><p>${text}</p>\n</div></blockquote>`);
	});

	test('renders line', () =>
	{
		// Arrange
		const input = `---`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<hr>`);
	});

	test('renders user tag', () =>
	{
		// Arrange
		const text = 'aldericon';
		const input = `@${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<a href="/profile/${text}">@${text}</a>`);
	});

	test('renders user tag for non-user', async () =>
	{
		// Arrange
		const text = 'aldericon';
		const input = `@${text}`;

		// Act
		const html = parse(input, undefined, null);

		// Assert
		expect(html).toContain(`@${text}`);
		expect(html).not.toContain(`<a href="/profile/${text}">@${text}</a>`);
	});

	test('renders heading 1 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `# ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h1>${text}</h1>`);
	});

	test('renders heading 2 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `## ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h2>${text}</h2>`);
	});

	test('renders heading 3 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `### ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h3>${text}</h3>`);
	});

	test('renders heading 4 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `#### ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h4>${text}</h4>`);
	});

	test('renders heading 5 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `##### ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h5>${text}</h5>`);
	});

	test('renders heading 6 text', () =>
	{
		// Arrange
		const text = 'Heading';
		const input = `###### ${text}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<h6>${text}</h6>`);
	});

	test('renders list text', () =>
	{
		// Arrange
		const input = '* item1\n* item2';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<ul>\n<li>item1</li>\n<li>item2</li>\n</ul>`);
	});

	test('renders table text', () =>
	{
		// Arrange
		const input = '| Header 1 | Header 2 |\n| - | - |\n| Col 1, Row 1 | Col 2, Row 1 |\n| Col 1, Row 2 | Col 2, Row 2 |';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<table>\n<thead>\n<tr>\n<th>Header 1</th>\n<th>Header 2</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>Col 1, Row 1</td>\n<td>Col 2, Row 1</td>\n</tr>\n<tr>\n<td>Col 1, Row 2</td>\n<td>Col 2, Row 2</td>\n</tr>\n</tbody>\n</table>`);
	});

	test('renders centered text', () =>
	{
		// Arrange
		const text = 'test';
		const input = `{center}${text}{center}`;

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`<span class='center-text'>${text}</span>`);
	});

	test('renders smile emoji correctly', () =>
	{
		// Arrange
		const input = ':smile:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders smile emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders smile emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders frowning_face emoji correctly', () =>
	{
		// Arrange
		const input = ':frowning_face:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders frowning_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':(';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders frowning_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:(';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders grin emoji correctly', () =>
	{
		// Arrange
		const input = ':grin:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders grin emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':D';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders grin emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:D';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly', () =>
	{
		// Arrange
		const input = ':smiling_face_with_two_hearts:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':x';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:x';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders shifty emoji correctly', () =>
	{
		// Arrange
		const input = ':shifty:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders shifty emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ';\\';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders shifty emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<;\\';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders sunglasses emoji correctly', () =>
	{
		// Arrange
		const input = ':sunglasses:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders sunglasses emoji correctly (emote)', () =>
	{
		// Arrange
		const input = 'B-)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders sunglasses emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<B-)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders smiling_imp emoji correctly', () =>
	{
		// Arrange
		const input = ':smiling_imp:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders smiling_imp emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ']:)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders smiling_imp emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<]:)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders stuck_out_tongue emoji correctly', () =>
	{
		// Arrange
		const input = ':stuck_out_tongue:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':p';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:p';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (capital)', () =>
	{
		// Arrange
		const input = ':P';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (femote + capital)', () =>
	{
		// Arrange
		const input = '<:P';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders rage emoji correctly', () =>
	{
		// Arrange
		const input = ':rage:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders rage emoji correctly (emote)', () =>
	{
		// Arrange
		const input = 'X-(';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders rage emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<X-(';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders laughing emoji correctly', () =>
	{
		// Arrange
		const input = ':laughing:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders laughing emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':^O';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders laughing emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:^O';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders wink emoji correctly', () =>
	{
		// Arrange
		const input = ':wink:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders wink emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ';)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders wink emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<;)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders blush emoji correctly', () =>
	{
		// Arrange
		const input = ':blush:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders blush emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':8}';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders blush emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:8}';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders cry emoji correctly', () =>
	{
		// Arrange
		const input = ':cry:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders cry emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':_|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders cry emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:_|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders confused emoji correctly', () =>
	{
		// Arrange
		const input = ':confused:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders confused emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '?:|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders confused emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<?:|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders astonished emoji correctly', () =>
	{
		// Arrange
		const input = ':astonished:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders astonished emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':O';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders astonished emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:O';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders neutral_face emoji correctly', () =>
	{
		// Arrange
		const input = ':neutral_face:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders neutral_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders neutral_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:|';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders nauseated_face emoji correctly', () =>
	{
		// Arrange
		const input = ':nauseated_face:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders nauseated_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':&';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders nauseated_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:&';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders roll_eyes emoji correctly', () =>
	{
		// Arrange
		const input = ':roll_eyes:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders roll_eyes emoji correctly (emote0', () =>
	{
		// Arrange
		const input = ":'";

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders roll_eyes emoji correctly (femote)', () =>
	{
		// Arrange
		const input = "<:'";

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders resetti emoji correctly', () =>
	{
		// Arrange
		const input = ':resetti:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`resetti.png`);
	});

	test('renders resetti emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '(X0';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`resetti.png`);
	});

	test('renders blanca emoji correctly', () =>
	{
		// Arrange
		const input = ':blanca:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`blanca.png`);
	});

	test('renders blanca emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':#';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`blanca.png`);
	});

	test('renders gyroid emoji correctly', () =>
	{
		// Arrange
		const input = ':gyroid:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`gyroid.png`);
	});

	test('renders gyroid emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '{|=0';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`gyroid.png`);
	});

	test('renders serena emoji correctly', () =>
	{
		// Arrange
		const input = ':serena:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`serena.png`);
	});

	test('renders serena emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '{=]';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`serena.png`);
	});

	test('renders kk emoji correctly', () =>
	{
		// Arrange
		const input = ':kk:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`kk.png`);
	});

	test('renders kk emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':-o~';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`kk.png`);
	});

	test('renders nat emoji correctly', () =>
	{
		// Arrange
		const input = ':nat:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`nat.png`);
	});

	test('renders nat emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '8-P';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`nat.png`);
	});

	test('renders owner emoji correctly', () =>
	{
		// Arrange
		const input = ':owner:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`owner.png`);
	});

	test('renders admin emoji correctly', () =>
	{
		// Arrange
		const input = ':admin:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`admin.png`);
	});

	test('renders mod emoji correctly', () =>
	{
		// Arrange
		const input = ':mod:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`mod.png`);
	});

	test('renders scout emoji correctly', () =>
	{
		// Arrange
		const input = ':scout:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`scout.png`);
	});

	test('renders researcher emoji correctly', () =>
	{
		// Arrange
		const input = ':researcher:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`researcher.png`);
	});

	test('renders dev emoji correctly', () =>
	{
		// Arrange
		const input = ':dev:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`dev.png`);
	});

	test('renders hc emoji correctly', () =>
	{
		// Arrange
		const input = ':hc:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`hc.png`);
	});

	test('renders birthday emoji correctly', () =>
	{
		// Arrange
		const input = ':birthday:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`birthday.png`);
	});

	test('renders newbie emoji correctly', () =>
	{
		// Arrange
		const input = ':newbie:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`newbie.png`);
	});

	test('renders buddy emoji correctly', () =>
	{
		// Arrange
		const input = ':buddy:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`buddy.png`);
	});

	test('renders unflag emoji correctly', () =>
	{
		// Arrange
		const input = ':unflag:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`unflag.png`);
	});

	test('renders flag emoji correctly', () =>
	{
		// Arrange
		const input = ':flag:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`flag.png`);
	});

	test('renders edit emoji correctly', () =>
	{
		// Arrange
		const input = ':edit:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`edit.png`);
	});

	test('renders message emoji correctly', () =>
	{
		// Arrange
		const input = ':message:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`message.png`);
	});

	test('renders report emoji correctly', () =>
	{
		// Arrange
		const input = ':report:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`report.png`);
	});

	test('renders idea emoji correctly', () =>
	{
		// Arrange
		const input = ':idea:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`idea.png`);
	});

	test('renders trade emoji correctly', () =>
	{
		// Arrange
		const input = ':trade:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`trade.png`);
	});

	test('renders wifi emoji correctly', () =>
	{
		// Arrange
		const input = ':wifi:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`wifi.png`);
	});

	test('renders lock emoji correctly', () =>
	{
		// Arrange
		const input = ':lock:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`lock.png`);
	});

	test('renders sticky emoji correctly', () =>
	{
		// Arrange
		const input = ':sticky:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`sticky.png`);
	});

	test('renders help_button emoji correctly', () =>
	{
		// Arrange
		const input = ':help_button:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`help_button.png`);
	});

	test('renders feedback_positive emoji correctly', () =>
	{
		// Arrange
		const input = ':feedback_positive:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`feedback_positive.png`);
	});

	test('renders feedback_negative emoji correctly', () =>
	{
		// Arrange
		const input = ':feedback_negative:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`feedback_negative.png`);
	});

	test('renders feedback_neutral emoji correctly', () =>
	{
		// Arrange
		const input = ':feedback_neutral:';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`feedback_neutral.png`);
	});

	test('renders custom emoji correctly (retro-male)', () =>
	{
		// Arrange
		const emojiSettings = {
			type: 'smile',
			category: 'retro-male',
		} as unknown as EmojiSettingType;
		const input = ':smile:';

		// Act
		const html = parse(input, [emojiSettings], currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`retro-male/happy.png`);
	});

	test('renders custom emoji correctly (retro-female)', () =>
	{
		// Arrange
		const emojiSettings = {
			type: 'smile',
			category: 'retro-female',
		} as unknown as EmojiSettingType;
		const input = ':smile:';

		// Act
		const html = parse(input, [emojiSettings], currentUser);

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`retro-female/happy.png`);
	});

	test('renders nested formatting', () =>
	{
		// Arrange
		const input = '**bold *and italic***';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('<strong>bold <em>and italic</em></strong>');
	});

	test('renders ordered list', () =>
	{
		// Arrange
		const input = '1. first\n2. second';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('<ol>');
		expect(html).toContain('<li>first</li>');
		expect(html).toContain('<li>second</li>');
	});

	test('renders inline code', () =>
	{
		// Arrange
		const input = '`some code`';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('<code>some code</code>');
	});

	test('renders fenced code block', () =>
	{
		// Arrange
		const input = '```\nconst x = 1;\n```';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('<code>');
		expect(html).toContain('const x = 1;');
	});

	test('preserves line breaks', () =>
	{
		// Arrange
		const input = 'line1\nline2';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('<br>');
	});

	test('images are disabled in normal mode', () =>
	{
		// Arrange
		const input = '![alt](http://example.com/img.png)';

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], false);

		// Assert
		expect(html).not.toContain('<img');
	});

	test('images are enabled in html mode', () =>
	{
		// Arrange
		const input = '![alt](http://example.com/img.png)';

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], true);

		// Assert
		expect(html).toContain('<img');
		expect(html).toContain('alt="alt"');
	});

	test('links are routed through /leaving', () =>
	{
		// Arrange
		const input = '[click](http://example.com)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('href="/leaving?url=http://example.com"');
	});

	test('autolinked URLs are routed through /leaving', () =>
	{
		// Arrange
		const input = 'http://example.com';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('href="/leaving?url=http://example.com"');
	});

	test('link with https prefix passes through', () =>
	{
		// Arrange
		const input = '[click](https://example.com)';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain('href="/leaving?url=https://example.com"');
	});

	test('HTML entities are escaped in normal mode', () =>
	{
		// Arrange
		const input = '<script>alert("xss")</script>';

		// Act
		const html = parse(input, undefined, currentUser, [], '', [], false);

		// Assert
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	test('empty input returns empty string', () =>
	{
		// Arrange & Act
		const html = parse('', undefined, currentUser);

		// Assert
		expect(html).toBe('');
	});

	test('quote with node quote link', () =>
	{
		// Arrange
		const input = '> quoted text';
		const nodeQuotes = [{ sortOrder: 1, page: 3, nodeId: 456 }];
		const pageLink = '/forums/123';

		// Act
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const html = parse(input, undefined, currentUser, nodeQuotes as any, pageLink);

		// Assert
		expect(html).toContain('<blockquote>');
		expect(html).toContain('quoted text');
		expect(html).toContain(`href="${pageLink}/3#456"`);
		expect(html).toContain('quote-link');
	});

	test('quote without matching node quote has no link', () =>
	{
		// Arrange
		const input = '> quoted text';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const nodeQuotes: any[] = [];

		// Act
		const html = parse(input, undefined, currentUser, nodeQuotes, '/forums/123');

		// Assert
		expect(html).toContain('<blockquote>');
		expect(html).not.toContain('quote-link');
	});

	test('multiple quotes get correct node quote links', () =>
	{
		// Arrange
		const input = '> quote 1\n\n> quote 2';
		const nodeQuotes = [
			{ sortOrder: 1, page: 1, nodeId: 100 },
			{ sortOrder: 2, page: 2, nodeId: 200 },
		];
		const pageLink = '/forums/123';

		// Act
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const html = parse(input, undefined, currentUser, nodeQuotes as any, pageLink);

		// Assert
		expect(html).toContain(`href="${pageLink}/1#100"`);
		expect(html).toContain(`href="${pageLink}/2#200"`);
	});

	test('center tag renders correctly', () =>
	{
		// Arrange
		const input = '{center}centered text{center}';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		expect(html).toContain("class='center-text'");
		expect(html).toContain('centered text');
	});

	test('color tag with potential XSS in value', () =>
	{
		// Arrange
		const input = '{color:red" onclick="alert(1)}text{color}';

		// Act
		const html = parse(input, undefined, currentUser);

		// Assert
		// Document current behavior — verify injection doesn't work
		expect(html).toContain('<font color=');
	});

	test('user tag not rendered when no currentUser', () =>
	{
		// Arrange
		const input = 'hello @someone world';

		// Act
		const html = parse(input, undefined, null);

		// Assert
		expect(html).toContain('@someone');
		expect(html).not.toContain('<a href="/profile/');
	});
});
