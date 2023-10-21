import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({hideLabel, name, label, value, required, placeholder, rows,
	maxLength, textRef, changeHandler}) =>
{
	return (
		<>
		{!hideLabel && (
			<label htmlFor={name}>{label}:</label>
		)}
		<textarea
			name={name}
			defaultValue={value}
			required={required}
			aria-label={label}
			id={name}
			data-lpignore='true'
			placeholder={placeholder}
			rows={rows}
			maxLength={maxLength}
			ref={textRef}
			onChange={changeHandler}
		/>
		</>
	);
}

TextArea.propTypes = {
	hideLabel: PropTypes.bool,
	label: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.string,
	required: PropTypes.bool,
	placeholder: PropTypes.string,
	rows: PropTypes.number,
	maxLength: PropTypes.number,
	textRef: PropTypes.any,
	changeHandler: PropTypes.func,
};

TextArea.defaultProps = {
	hideLabel: false,
	required: false,
	rows: 2,
};

export default TextArea;