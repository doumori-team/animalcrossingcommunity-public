import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.tsx';
import { ElementClickButtonType } from '@types';

const MarkupButton = ({
	tag,
	clickHandler,
	name,
	keyHint,
	icon,
}: MarkupButtonProps) =>
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

	return (
		<button
			className='MarkupButton'
			title={tooltip}
			{...interactivityAttributes}
			aria-label={name}
		>
			<FontAwesomeIcon name={icon} alt={name} />
		</button>
	);
};

type MarkupButtonProps = {
	tag: object
	clickHandler: (tag: object) => void // details of the tag, retrieved from the dicts at the top of markup.js.
	// If not present, the tag is not supported in the selected markup style,
	// so the button should be disabled
	name: string // function to call to insert the tag into the text area
	keyHint?: string // name of the tag, displayed on hover
	icon: string // keypress (if any) to , displayed on hover
};

export default MarkupButton;
