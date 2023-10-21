import React from 'react';
import PropTypes from 'prop-types';

import ErrorMessage from '@/components/layout/ErrorMessage.js';

const RequireLargeScreen = ({children, silent, size}) =>
{
	return (
		<div className='RequireLargeScreen'>
			<div className={`RequireLargeScreen_fallback_${size}`}>
				{!silent && (
					<ErrorMessage identifier='large-screen-required' />
				)}
			</div>
			<div className={`RequireLargeScreen_content_${size}`}>
				{children}
			</div>
		</div>
	);
}

RequireLargeScreen.propTypes = {
	children: PropTypes.node.isRequired,
	silent: PropTypes.bool,
	size: PropTypes.string.isRequired,
}

RequireLargeScreen.defaultProps = {
	silent: false,
}

export default RequireLargeScreen;
