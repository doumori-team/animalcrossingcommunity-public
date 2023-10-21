import React from 'react';
import PropTypes from 'prop-types';

const InnerSection = ({children}) =>
{
	return (
		<div className='InnerSection'>
			{children}
		</div>
	);
}

InnerSection.propTypes = {
	children: PropTypes.any.isRequired,
};

export default InnerSection;