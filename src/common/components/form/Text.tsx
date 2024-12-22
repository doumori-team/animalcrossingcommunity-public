import React from 'react';

import { RequireClientJS } from '@behavior';
import { FontAwesomeIcon } from '@layout';
import { ChangeHandlerInputType } from '@types';

const Text = ({
	hideLabel = false,
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
}: TextProps) =>
{
	const getInput = (javascriptOff: boolean = false) =>
	{
		const useClass = `${className}${placeholder && !hideLabel ? ' placeholder' : ''}`;

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
			{!hideLabel &&
				<>{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}<label htmlFor={name}>{label}:</label></>
			}
			{placeholder && !hideLabel ?
				<div className='placeholder'>
					<RequireClientJS fallback={
						getInput(true)
					}
					>
						{getInput()}
					</RequireClientJS>
					<span>({placeholder})</span>
				</div>
				:
				getInput()
			}
		</>
	);
};

type TextProps = {
	hideLabel?: boolean
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
};

export default Text;
