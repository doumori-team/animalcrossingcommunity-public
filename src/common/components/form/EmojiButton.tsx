import emojiDefs from 'common/markup/emoji.json';
import { constants } from '@utils';
import { EmojiSettingType, ElementClickButtonType } from '@types';

const EmojiButton = ({
	tag,
	clickHandler,
	name,
	keyHint,
	icon,
	type,
	emojiSettings,
}: EmojiButtonProps) =>
{
	const tooltip = keyHint ? `${name} (${keyHint})` : name;

	const interactivityAttributes =
		tag ?
			{ onClick: (event: ElementClickButtonType) =>
			{
				event.preventDefault(); clickHandler(tag);
			} }
			:
			{ disabled: true }
	;

	let src = '';
	const setting = emojiSettings?.find(s => s.type === type);

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
			{...interactivityAttributes}
		>
			<img src={`${constants.AWS_URL}/images/emoji/${src}${icon}.png`} alt={name} />
		</button>
	);
};

type EmojiButtonProps = {
	tag: string
	clickHandler: (tag: string) => void // details of the tag, retrieved from the dicts at the top of markup.js.
	// If not present, the tag is not supported in the selected markup style,
	// so the button should be disabled
	name: string // function to call to insert the tag into the text area
	keyHint?: string // name of the tag, displayed on hover
	icon: string // keypress (if any) to , displayed on hover
	type: string // name of image to show on the button
	emojiSettings: EmojiSettingType[] | undefined // type from emoji.json
};

export default EmojiButton;
