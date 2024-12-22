import React from 'react';

import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.ts';
import { ClickHandlerType } from '@types';

const Switch = ({
	label,
	name,
	value,
	clickHandler,
	variant = 'dark',
	information,
}: SwitchProps) =>
{
	return (
		<div className={`Switch ${variant}`}>
			<>{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}<label htmlFor={name}>{label}:</label></>
			<input
				type='checkbox'
				name={name}
				defaultChecked={value}
				value='true'
				id={name}
				aria-label={label}
				onClick={clickHandler}
			/>
		</div>
	);
};

type SwitchProps = {
	label: string
	name: string
	value?: boolean
	clickHandler?: ClickHandlerType
	variant?: 'dark' | 'light'
	information?: string
};

export default Switch;
