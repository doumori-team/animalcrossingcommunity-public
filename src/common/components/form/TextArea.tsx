import { ChangeHandlerTextAreaType } from '@types';

const TextArea = ({
	hideLabels = false,
	name,
	label,
	value,
	required = false,
	placeholder,
	rows = 2,
	maxLength,
	textRef,
	changeHandler,
}: TextAreaProps) =>
{
	return (
		<>
			{!hideLabels &&
				<label htmlFor={name}>{label}:</label>
			}
			{changeHandler ?
				<textarea
					name={name}
					defaultValue={value}
					required={required}
					aria-label={label}
					id={name}
					data-lpignore='true'
					autoComplete='off'
					placeholder={placeholder}
					rows={rows}
					maxLength={maxLength}
					ref={textRef}
					onChange={changeHandler}
				/>
				:
				<textarea
					name={name}
					defaultValue={value}
					required={required}
					aria-label={label}
					id={name}
					data-lpignore='true'
					autoComplete='off'
					placeholder={placeholder}
					rows={rows}
					maxLength={maxLength}
					ref={textRef}
				/>
			}
		</>
	);
};

type TextAreaProps = {
	hideLabels?: boolean
	label: string
	name: string
	value?: string
	required?: boolean
	placeholder?: string
	rows?: number
	maxLength?: number
	textRef?: any
	changeHandler?: ChangeHandlerTextAreaType
};

export default TextArea;
