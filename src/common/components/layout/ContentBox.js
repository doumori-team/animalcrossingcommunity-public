import React from 'react';
import PropTypes from 'prop-types';

const ContentBox = ({children}) =>
{
	return (
		<div className='ContentBox'>
			{children}
		</div>
	);
}

ContentBox.propTypes = {
	children: PropTypes.any.isRequired,
}

export default ContentBox;
