import React from 'react';
import PropTypes from 'prop-types';

const Checkbox = ({hideLabel, name, htmlFor, label, clickHandler, checked, value,
	type, disabled, required, labelClassName, form}) =>
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
		{!hideLabel && (
			<label htmlFor={id} className={labelClassName}>
				{label}
			</label>
		)}
		</>
	);
}

Checkbox.propTypes = {
	hideLabel: PropTypes.bool,
	htmlFor: PropTypes.string,
	name: PropTypes.string,
	label: PropTypes.string.isRequired,
	clickHandler: PropTypes.func,
	checked: PropTypes.bool,
	value: PropTypes.any,
	type: PropTypes.oneOf(['checkbox', 'radio']),
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	labelClassName: PropTypes.string,
	form: PropTypes.string,
};

Checkbox.defaultProps = {
	hideLabel: false,
	checked: false,
	type: 'checkbox',
	disabled: false,
	required: false,
	labelClassName: '',
};

export default Checkbox;