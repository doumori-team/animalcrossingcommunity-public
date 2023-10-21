import React from 'react';
import PropTypes from 'prop-types';

const Switch = ({label, name, value, clickHandler, variant}) =>
{
	return (
		<div className={`Switch ${variant}`}>
			<label htmlFor={name}>{label}:</label>
			<input
				type='checkbox'
				name={name}
				defaultChecked={value}
				value={true}
				id={name}
				aria-label={label}
				onClick={clickHandler}
			/>
		</div>
	);
}

Switch.propTypes = {
	label: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.bool,
	clickHandler: PropTypes.func,
	variant: PropTypes.oneOf(['dark', 'light']),
};

Switch.defaultProps = {
	variant: 'dark',
};

export default Switch;