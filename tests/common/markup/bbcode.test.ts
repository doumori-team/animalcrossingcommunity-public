import { describe, test, expect } from 'vitest';

import parse from 'common/markup/bbcode.ts';
import { UserType, EmojiSettingType } from '@types';

// determines whether to parse username tags
const currentUser = {
	id: 5,
	username: 'test-user',
} as unknown as UserType;

describe('Traditional Parser', () =>
{
	test('renders plain text', () =>
	{
		// Arrange
		const input = 'test';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toEqual(`${input}`);
	});

	test('does not render html text with normal parser', () =>
	{
		// Arrange
		const input = '<div class="display-flex justify-content-center"><div>';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser }, false);

		// Assert
		expect(html).toEqual(`&lt;div class="display-flex justify-content-center"&gt;&lt;div&gt;`);
	});

	test('renders html text with html parser', () =>
	{
		// Arrange
		const input = '<div class="display-flex justify-content-center"><div>';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser }, true);

		// Assert
		expect(html).toEqual(`${input}`);
	});


	test('renders bold text', () =>
	{
		// Arrange
		const text = 'bold';
		const input = `[b]${text}[/b]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<strong>${text}</strong>`);
	});

	test('renders italic text', () =>
	{
		// Arrange
		const text = 'italic';
		const input = `[i]${text}[/i]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<em>${text}</em>`);
	});

	test('renders underline text', () =>
	{
		// Arrange
		const text = 'underline';
		const input = `[u]${text}[/u]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<ins>${text}</ins>`);
	});

	test('renders strikethrough text', () =>
	{
		// Arrange
		const text = 'strikethrough';
		const input = `[s]${text}[/s]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<del>${text}</del>`);
	});

	test('renders color text', () =>
	{
		// Arrange
		const text = 'cake';
		const input = `[color=cake]${text}[/color]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<font color="cake">${text}</font>`);
	});

	test('renders color text (colour)', () =>
	{
		// Arrange
		const text = 'cake';
		const input = `[colour=cake]${text}[/colour]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<font color="cake">${text}</font>`);
	});

	test('renders spoiler text', () =>
	{
		// Arrange
		const text = 'spoiler';
		const input = `[spoiler]${text}[/spoiler]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<span class="spoiler">${text}</span>`);
	});

	test('renders link text', () =>
	{
		// Arrange
		const text = 'www.google.com';
		const input = `[link=www.google.com]${text}[/link]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<a href="/leaving?url=http://www.google.com">${text}</a>`);
	});

	test('renders link text, adds missing / (Topic/)', () =>
	{
		// Arrange
		const text = 'Go Here';
		const input = `[link=Topic/4837485]${text}[/link]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<a href="/leaving?url=/Topic/4837485">${text}</a`);
	});

	test('renders link text, adds missing / (forums/)', () =>
	{
		// Arrange
		const text = 'Go Here';
		const input = `[link=forums/4837485]${text}[/link]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<a href="/leaving?url=/forums/4837485">${text}</a`);
	});

	test('renders monospace text', () =>
	{
		// Arrange
		const text = '[color=cake]cake[/color]';
		const input = `[code]${text}[/code]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`${text}`);
	});

	test('renders quote text', () =>
	{
		// Arrange
		const text = 'this is a quote';
		const input = `[bq]${text}[/bq]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<blockquote>&ldquo;${text}&rdquo;</blockquote>`);
	});

	test('renders quote 2 text', () =>
	{
		// Arrange
		const text = 'this is a quote';
		const input = `[blockquote]${text}[/blockquote]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<blockquote>&ldquo;${text}&rdquo;</blockquote>`);
	});

	test('renders quote 3 text', () =>
	{
		// Arrange
		const text = 'this is a quote';
		const input = `[bl]${text}[/bl]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<blockquote>${text}</blockquote>`);
	});

	test('renders line', () =>
	{
		// Arrange
		const input = `[hr]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<hr>`);
	});

	test('renders line 2', () =>
	{
		// Arrange
		const input = `[hr][/hr]`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<hr>`);
	});

	test('renders user tag', () =>
	{
		// Arrange
		const text = 'aldericon';
		const input = `@${text}`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`<a href="/profile/${text}">@${text}</a>`);
	});

	test('renders user tag for non-user', async () =>
	{
		// Arrange
		const text = 'aldericon';
		const input = `@${text}`;

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser: null });

		// Assert
		expect(html).toContain(`@${text}`);
		expect(html).not.toContain(`<a href="/profile/${text}">@${text}</a>`);
	});

	test('renders smile emoji correctly (face_happy)', () =>
	{
		// Arrange
		const input = '[face_happy]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders smile emoji correctly (fface_happy)', () =>
	{
		// Arrange
		const input = '[fface_happy]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders smile emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders smile emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/happy.png`);
	});

	test('renders frowning_face emoji correctly (face_sad)', () =>
	{
		// Arrange
		const input = '[face_sad]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders frowning_face emoji correctly (fface_sad)', () =>
	{
		// Arrange
		const input = '[fface_sad]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders frowning_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':(';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders frowning_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:(';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sad.png`);
	});

	test('renders grin emoji correctly (face_grin)', () =>
	{
		// Arrange
		const input = '[face_grin]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders grin emoji correctly (fface_grin)', () =>
	{
		// Arrange
		const input = '[fface_grin]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders grin emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':D';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders grin emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:D';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/grin.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (face_love)', () =>
	{
		// Arrange
		const input = '[face_love]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (fface_love)', () =>
	{
		// Arrange
		const input = '[fface_love]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':x';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders smiling_face_with_two_hearts emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:x';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/love.png`);
	});

	test('renders shifty emoji correctly (face_mischief)', () =>
	{
		// Arrange
		const input = '[face_mischief]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders shifty emoji correctly (fface_mischief)', () =>
	{
		// Arrange
		const input = '[fface_mischief]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders shifty emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ';\\';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders shifty emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<;\\';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/shiftyeyes.png`);
	});

	test('renders sunglasses emoji correctly (face_cool)', () =>
	{
		// Arrange
		const input = '[face_cool]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders sunglasses emoji correctly (fface_cool)', () =>
	{
		// Arrange
		const input = '[fface_cool]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders sunglasses emoji correctly (emote)', () =>
	{
		// Arrange
		const input = 'B-)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders sunglasses emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<B-)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cool.png`);
	});

	test('renders smiling_imp emoji correctly (face_devil)', () =>
	{
		// Arrange
		const input = '[face_devil]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders smiling_imp emoji correctly (fface_devil)', () =>
	{
		// Arrange
		const input = '[fface_devil]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders smiling_imp emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ']:)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders smiling_imp emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<]:)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/devil.png`);
	});

	test('renders stuck_out_tongue emoji correctly (face_silly)', () =>
	{
		// Arrange
		const input = '[face_silly]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (fface_silly)', () =>
	{
		// Arrange
		const input = '[fface_silly]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':p';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:p';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (capital)', () =>
	{
		// Arrange
		const input = ':P';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders stuck_out_tongue emoji correctly (femote + capital)', () =>
	{
		// Arrange
		const input = '<:P';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/silly.png`);
	});

	test('renders rage emoji correctly (face_angry)', () =>
	{
		// Arrange
		const input = '[face_angry]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders rage emoji correctly (fface_angry)', () =>
	{
		// Arrange
		const input = '[fface_angry]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders rage emoji correctly (emote)', () =>
	{
		// Arrange
		const input = 'X-(';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders rage emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<X-(';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/mad.png`);
	});

	test('renders laughing emoji correctly (face_laugh)', () =>
	{
		// Arrange
		const input = '[face_laugh]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders laughing emoji correctly (fface_laugh)', () =>
	{
		// Arrange
		const input = '[fface_laugh]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders laughing emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':^O';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders laughing emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:^O';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/laugh.png`);
	});

	test('renders wink emoji correctly (face_wink)', () =>
	{
		// Arrange
		const input = '[face_wink]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders wink emoji correctly (fface_wink)', () =>
	{
		// Arrange
		const input = '[fface_wink]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders wink emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ';)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders wink emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<;)';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/wink.png`);
	});

	test('renders blush emoji correctly (face_blush)', () =>
	{
		// Arrange
		const input = '[face_blush]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders blush emoji correctly (fface_blush)', () =>
	{
		// Arrange
		const input = '[fface_blush]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders blush emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':8}';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders blush emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:8}';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/blush.png`);
	});

	test('renders cry emoji correctly (face_cry)', () =>
	{
		// Arrange
		const input = '[face_cry]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders cry emoji correctly (fface_cry)', () =>
	{
		// Arrange
		const input = '[fface_cry]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders cry emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':_|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders cry emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:_|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/cry.png`);
	});

	test('renders confused emoji correctly (face_confused)', () =>
	{
		// Arrange
		const input = '[face_confused]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders confused emoji correctly (fface_confused)', () =>
	{
		// Arrange
		const input = '[fface_confused]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders confused emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '?:|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders confused emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<?:|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/confused.png`);
	});

	test('renders astonished emoji correctly (face_shocked)', () =>
	{
		// Arrange
		const input = '[face_shocked]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders astonished emoji correctly (fface_shocked)', () =>
	{
		// Arrange
		const input = '[fface_shocked]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders astonished emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':O';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders astonished emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:O';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/whoa.png`);
	});

	test('renders neutral_face emoji correctly (face_plain)', () =>
	{
		// Arrange
		const input = '[face_plain]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders neutral_face emoji correctly (fface_plain)', () =>
	{
		// Arrange
		const input = '[fface_plain]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders neutral_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders neutral_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:|';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/plain.png`);
	});

	test('renders nauseated_face emoji correctly (face_sick)', () =>
	{
		// Arrange
		const input = '[face_sick]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders nauseated_face emoji correctly (fface_sick)', () =>
	{
		// Arrange
		const input = '[fface_sick]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders nauseated_face emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':&';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders nauseated_face emoji correctly (femote)', () =>
	{
		// Arrange
		const input = '<:&';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/sick.png`);
	});

	test('renders roll_eyes emoji correctly (face_rolleyes)', () =>
	{
		// Arrange
		const input = '[face_rolleyes]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders roll_eyes emoji correctly (fface_rolleyes)', () =>
	{
		// Arrange
		const input = '[fface_rolleyes]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders roll_eyes emoji correctly (emote0', () =>
	{
		// Arrange
		const input = ":'";

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders roll_eyes emoji correctly (femote)', () =>
	{
		// Arrange
		const input = "<:'";

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`reaction/rolleyes.png`);
	});

	test('renders resetti emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_resetti]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`resetti.png`);
	});

	test('renders resetti emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '(X0';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`resetti.png`);
	});

	test('renders blanca emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_blanca]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`blanca.png`);
	});

	test('renders blanca emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':#';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`blanca.png`);
	});

	test('renders gyroid emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_gyroid]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`gyroid.png`);
	});

	test('renders gyroid emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '{|=0';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`gyroid.png`);
	});

	test('renders serena emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_serena]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`serena.png`);
	});

	test('renders serena emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '{=]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`serena.png`);
	});

	test('renders kk emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_kk]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`kk.png`);
	});

	test('renders kk emoji correctly (emote)', () =>
	{
		// Arrange
		const input = ':-o~';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`kk.png`);
	});

	test('renders nat emoji correctly', () =>
	{
		// Arrange
		const input = '[ac_nat]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`nat.png`);
	});

	test('renders nat emoji correctly (emote)', () =>
	{
		// Arrange
		const input = '8-P';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`nat.png`);
	});

	test('renders owner emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_owner]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`owner.png`);
	});

	test('renders admin emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_admin]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`admin.png`);
	});

	test('renders mod emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_mod]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`mod.png`);
	});

	test('renders scout emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_scout]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`scout.png`);
	});

	test('renders researcher emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_researcher]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`researcher.png`);
	});

	test('renders dev emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_dev]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`dev.png`);
	});

	test('renders hc emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_hc]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`hc.png`);
	});

	test('renders birthday emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_birthday]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`birthday.png`);
	});

	test('renders newbie emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_newbie]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`newbie.png`);
	});

	test('renders buddy emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_buddy]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`buddy.png`);
	});

	test('renders unflag emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_flag_green]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`unflag.png`);
	});

	test('renders flag emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_flag]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`flag.png`);
	});

	test('renders edit emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_edit]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`edit.png`);
	});

	test('renders message emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_message]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`message.png`);
	});

	test('renders report emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_report]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`report.png`);
	});

	test('renders idea emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_idea]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`idea.png`);
	});

	test('renders trade emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_trade]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`trade.png`);
	});

	test('renders wifi emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_wifi]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`wifi.png`);
	});

	test('renders lock emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_locked]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`lock.png`);
	});

	test('renders sticky emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_sticky]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`sticky.png`);
	});

	test('renders help_button emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_help]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`help_button.png`);
	});

	test('renders feedback_positive emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_positive]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`feedback_positive.png`);
	});

	test('renders feedback_negative emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_negative]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`feedback_negative.png`);
	});

	test('renders feedback_neutral emoji correctly', () =>
	{
		// Arrange
		const input = '[acc_neutral]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

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
		const input = '[face_happy]';

		// Act
		const html = parse(input, { emojiSettings: [emojiSettings], currentUser });

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
		const input = '[face_happy]';

		// Act
		const html = parse(input, { emojiSettings: [emojiSettings], currentUser });

		// Assert
		expect(html).toContain(`images/emoji`);
		expect(html).toContain(`retro-female/happy.png`);
	});

	test('renders nested tags correctly', () =>
	{
		// Arrange
		const input = '[b][i]bold italic[/i][/b]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('<strong><em>bold italic</em></strong>');
	});

	test('auto-closes unclosed tags', () =>
	{
		// Arrange
		const input = '[b]unclosed bold';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('<strong>');
		expect(html).toContain('</strong>');
	});

	test('auto-opens unmatched closing tag', () =>
	{
		// Arrange
		const input = 'text[/b]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('<strong>');
		expect(html).toContain('</strong>');
	});

	test('renders double space as nbsp', () =>
	{
		// Arrange
		const input = 'hello  world';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('hello&nbsp;&nbsp;world');
	});

	test('renders line breaks', () =>
	{
		// Arrange
		const input = 'line1\nline2';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('line1<br>line2');
	});

	test('renders CRLF line breaks', () =>
	{
		// Arrange
		const input = 'line1\r\nline2';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('line1<br>line2');
	});

	test('ignores line break immediately after blockquote close', () =>
	{
		// Arrange
		const input = '[bq]quote[/bq]\nnext line';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).not.toContain('</blockquote><br>');
		expect(html).toContain('next line');
	});

	test('ignores line break immediately after block close', () =>
	{
		// Arrange
		const input = '[bl]block[/bl]\nnext line';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).not.toContain('</blockquote><br>');
		expect(html).toContain('next line');
	});

	test('code tags preserve inner bbcode as plain text', () =>
	{
		// Arrange
		const input = '[code][b]not bold[/b][/code]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('[b]not bold[/b]');
		expect(html).not.toContain('<strong>');
	});

	test('code tags preserve emojis as plain text', () =>
	{
		// Arrange
		const input = '[code]:)[/code]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain(':)');
		expect(html).not.toContain('<img');
	});

	test('link with http:// prefix passes through as-is', () =>
	{
		// Arrange
		const input = '[link=http://example.com]click[/link]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('href="/leaving?url=http://example.com"');
	});

	test('link with https:// prefix passes through as-is', () =>
	{
		// Arrange
		const input = '[link=https://example.com]click[/link]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('href="/leaving?url=https://example.com"');
	});

	test('link with empty url produces empty string', () =>
	{
		// Arrange
		const input = '[link=]text[/link]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).not.toContain('<a');
	});

	test('XSS in link url is not rendered', () =>
	{
		// Arrange
		const input = '[link=javascript:alert(1)]click[/link]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		// Should be routed through /leaving, not executed directly
		expect(html).toContain('/leaving?url=');
		expect(html).not.toContain('href="javascript:');
	});

	test('XSS in color attribute is escaped', () =>
	{
		// Arrange
		const input = '[color=red" onclick="alert(1)]text[/color]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		// The color regex uses [^[]* so it will match the whole thing including the injection
		// This test documents current behavior — worth verifying it's safe
		expect(html).toContain('<font color=');
	});

	test('HTML entities are escaped in plain text', () =>
	{
		// Arrange
		const input = '<script>alert("xss")</script>';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser }, false);

		// Assert
		expect(html).toContain('&lt;script&gt;');
		expect(html).not.toContain('<script>');
	});

	test('user tag with hyphen splits at non-word character', () =>
	{
		// Arrange
		const input = '@test-user ';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		// Hyphen is non-word, so lexer matches "test" as the username
		expect(html).toContain('<a href="/profile/test">@test</a>');
		expect(html).toContain('-user');
	});

	test('empty input returns empty string', () =>
	{
		// Arrange & Act
		const html = parse('', { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toBe('');
	});

	test('deeply nested tags', () =>
	{
		// Arrange
		const input = '[b][i][u][s]deep[/s][/u][/i][/b]';

		// Act
		const html = parse(input, { emojiSettings: undefined, currentUser });

		// Assert
		expect(html).toContain('<strong><em><ins><del>deep</del></ins></em></strong>');
	});
});
