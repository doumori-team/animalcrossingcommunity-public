import React from 'react';
import PropTypes from 'prop-types';

const Grid = ({name, options, children, message}) =>
{
	return (
		<>
			{options.length > 0 ? (
				<div className='Grid'>
					{children}
				</div>
			) : (
				message ? (
					message
				) : (
					`No ${name}s found.`
				)
			)}
		</>
	);
}

Grid.propTypes = {
	name: PropTypes.string,
	options: PropTypes.array.isRequired,
	children: PropTypes.any.isRequired,
	message: PropTypes.any,
};

export default Grid;