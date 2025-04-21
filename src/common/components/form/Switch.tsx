import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.tsx';
import { ClickHandlerType } from '@types';

const Switch = ({
	label,
	name,
	value,
	clickHandler,
	variant = 'dark',
	information,
	switchFirst = false,
}: SwitchProps) =>
{
	return (
		<div className={`Switch ${variant}`}>
			{!switchFirst && <>
				{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}
				<label htmlFor={name} className='Switch_switchLast'>{label}:</label>
			</>}
			<input
				type='checkbox'
				name={name}
				defaultChecked={value}
				value='true'
				id={name}
				aria-label={label}
				onClick={clickHandler}
			/>
			{switchFirst && <>
				<label htmlFor={name} className='Switch_switchFirst'>{label}</label>
				{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}
			</>}
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
	switchFirst?: boolean
};

export default Switch;
