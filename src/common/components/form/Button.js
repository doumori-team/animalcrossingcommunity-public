import React from 'react';
import PropTypes from 'prop-types';

import Spinner from '@/components/form/Spinner.js';

const Button = ({label, children, loading, clickHandler, type, className, title, image, form, disabled}) =>
{
	return (
		image ? (
			<input
				type='image'
				src={image}
				aria-label={label}
				title={title}
				onClick={clickHandler}
			/>
		) : (
			<button
				type={type}
				onClick={clickHandler}
				aria-label={label}
				className={className}
				title={title}
				aria-disabled={loading || disabled}
				disabled={loading || disabled}
				form={form}
			>
				{loading ? (
					<Spinner />
				) : (
					children ? children : label
				)}
			</button>
		)
	);
}

Button.propTypes = {
	label: PropTypes.string.isRequired,
	children: PropTypes.any,
	loading: PropTypes.bool,
	clickHandler: PropTypes.func,
	type: PropTypes.oneOf(['button', 'submit']).isRequired,
	className: PropTypes.string,
	title: PropTypes.string,
	image: PropTypes.string,
	form: PropTypes.string,
	disabled: PropTypes.bool,
};

Button.defaultProps = {
	loading: false,
	type: 'button',
	disabled: false,
};

export default Button;