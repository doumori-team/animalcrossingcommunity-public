import React from 'react';

import { ClickHandlerType } from '@types';

const Checkbox = ({
	hideLabel = false,
	name,
	htmlFor,
	label,
	clickHandler,
	checked = false,
	value,
	type = 'checkbox',
	disabled = false,
	required = false,
	labelClassName = '',
	form,
}: CheckboxProps) =>
{
	const id = htmlFor ? htmlFor : name;

	return (
		<>
			<input
				name={name}
				id={id}
				type={type}
				onClick={clickHandler}
				defaultChecked={checked}
				value={value}
				disabled={disabled}
				aria-label={label}
				required={required}
				form={form}
			/>
			{!hideLabel &&
				<label htmlFor={id} className={labelClassName}>
					{label}
				</label>
			}
		</>
	);
};

type CheckboxProps = {
	hideLabel?: boolean
	htmlFor?: string
	name?: string
	label: string
	clickHandler?: ClickHandlerType
	checked?: boolean
	value?: any
	type?: 'checkbox' | 'radio'
	disabled?: boolean
	required?: boolean
	labelClassName?: string
	form?: string
};

export default Checkbox;
