import React from 'react';
import PropTypes from 'prop-types';

import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.js';

const Switch = ({label, name, value, clickHandler, variant, information}) =>
{
	return (
		<div className={`Switch ${variant}`}>
			<>{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}<label htmlFor={name}>{label}:</label></>
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
	information: PropTypes.string,
};

Switch.defaultProps = {
	variant: 'dark',
};

export default Switch;