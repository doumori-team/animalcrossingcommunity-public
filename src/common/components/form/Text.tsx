import { RequireClientJS } from '@behavior';
import { FontAwesomeIcon } from '@layout';
import { ChangeHandlerInputType } from '@types';

const Text = ({
	hideLabels = false,
	label,
	type = 'text',
	name,
	value,
	required = false,
	placeholder,
	maxLength = 200,
	minLength,
	changeHandler,
	min = 0,
	max = 1000000,
	className,
	pattern,
	textRef,
	step = 1,
	information,
	hideTrailingPlaceholder = false,
}: TextProps) =>
{
	const getInput = (javascriptOff: boolean = false) =>
	{
		const useClass = `${className}${placeholder && !hideLabels ? ' placeholder' : ''}`;

		return (
			changeHandler ?
				<input
					type={type}
					name={name}
					value={value ?? ''}
					onChange={changeHandler}
					id={name}
					aria-label={label}
					data-lpignore='true'
					autoComplete='off'
					required={required}
					placeholder={placeholder}
					maxLength={maxLength}
					minLength={minLength}
					min={min}
					max={max}
					className={useClass}
					pattern={pattern}
					ref={textRef}
					step={step}
				/>
				:
				javascriptOff ?
					<input
						type={type}
						name={name}
						defaultValue={value ?? ''}
						id={name}
						aria-label={label}
						data-lpignore='true'
						autoComplete='off'
						required={required}
						placeholder={placeholder}
						maxLength={maxLength}
						minLength={minLength}
						min={min}
						max={max}
						className={useClass}
						ref={textRef}
						step={step}
					/>
					:
					<input
						type={type}
						name={name}
						defaultValue={value ?? ''}
						id={name}
						aria-label={label}
						data-lpignore='true'
						autoComplete='off'
						required={required}
						placeholder={placeholder}
						maxLength={maxLength}
						minLength={minLength}
						min={min}
						max={max}
						className={useClass}
						pattern={pattern}
						ref={textRef}
						step={step}
					/>


		);
	};

	return (
		<>
			{!hideLabels &&
				<>{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}<label htmlFor={name}>{label}:</label></>
			}
			{placeholder && !hideLabels ?
				<div className='placeholder'>
					<RequireClientJS fallback={
						getInput(true)
					}
					>
						{getInput()}
					</RequireClientJS>
					{!hideTrailingPlaceholder && <span>({placeholder})</span>}
				</div>
				:
				getInput()
			}
		</>
	);
};

type TextProps = {
	hideLabels?: boolean
	label: string
	type?: 'text' | 'number' | 'email' | 'date'
	name: string
	value?: string | number | null
	required?: boolean
	placeholder?: string
	maxLength?: number
	changeHandler?: ChangeHandlerInputType
	min?: string | number
	max?: string | number
	pattern?: string
	className?: string
	textRef?: any
	step?: number
	minLength?: number
	information?: string
	hideTrailingPlaceholder?: boolean
};

export default Text;
