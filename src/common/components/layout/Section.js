import React from 'react';
import PropTypes from 'prop-types';

const Section = ({children}) =>
{
	return (
		<div className='Section'>
			{children}
		</div>
	);
}

Section.propTypes = {
	children: PropTypes.any.isRequired,
};

export default Section;