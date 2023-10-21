import React from 'react';
import PropTypes from 'prop-types';

const Spinner = ({type}) =>
{
	return (
		<div
			className='Spinner'
			role='status'
			aria-live='polite'
			aria-label='Loading...'
		>
			{type === 'dot' && (
				<div className='lds-default'>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
					<div/>
				</div>
			)}
			{type === 'border' && (
				<div className='lds-ring'>
					<div/>
					<div/>
					<div/>
					<div/>
				</div>
			)}
		</div>
	);
}

Spinner.propTypes = {
	type: PropTypes.oneOf(['dot', 'border']).isRequired,
};

Spinner.defaultProps = {
	type: 'border',
};

export default Spinner;