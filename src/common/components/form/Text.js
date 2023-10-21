import React from 'react';
import PropTypes from 'prop-types';

import RequireClientJS from '@/components/behavior/RequireClientJS.js';
import FontAwesomeIcon from '@/components/layout/FontAwesomeIcon.js';

const Text = ({hideLabel, label, type, name, value, required, placeholder, maxLength,
	minLength, changeHandler, min, max, className, pattern, textRef, step, information}) =>
{
	const getInput = (javascriptOff) =>
	{
		const useClass = `${className}${placeholder && !hideLabel ? ' placeholder' : ''}`

		return (
			changeHandler ? (
				<input
					type={type}
					name={name}
					value={value}
					onChange={changeHandler}
					id={name}
					aria-label={label}
					data-lpignore='true'
					required={required}
					placeholder={placeholder}
					maxLength={maxLength}
					minLength={minLength}
					min={min}
					max={max}
					className={useClass}
					pattern={pattern}
					ref={textRef}
					step={step}
				/>
			) : (
				javascriptOff ? (
					<input
						type={type}
						name={name}
						defaultValue={value}
						id={name}
						aria-label={label}
						data-lpignore='true'
						required={required}
						placeholder={placeholder}
						maxLength={maxLength}
						minLength={minLength}
						min={min}
						max={max}
						className={useClass}
						ref={textRef}
						step={step}
					/>
				) : (
					<input
						type={type}
						name={name}
						defaultValue={value}
						id={name}
						aria-label={label}
						data-lpignore='true'
						required={required}
						placeholder={placeholder}
						maxLength={maxLength}
						minLength={minLength}
						min={min}
						max={max}
						className={useClass}
						pattern={pattern}
						ref={textRef}
						step={step}
					/>
				)
			)
		);
	}

	return (
		<>
		{!hideLabel && (
			<>{information ? <FontAwesomeIcon name='information' alt='Information' title={information} /> : ''}<label htmlFor={name}>{label}:</label></>
		)}
		{(placeholder && !hideLabel) ? (
			<div className='placeholder'>
				<RequireClientJS fallback={
					getInput(true)
				}>
					{getInput()}
				</RequireClientJS>
				<span>({placeholder})</span>
			</div>
		) : (
			getInput()
		)}
		</>
	);
}

Text.propTypes = {
	hideLabel: PropTypes.bool,
	label: PropTypes.string.isRequired,
	type: PropTypes.oneOf(['text', 'number', 'email', 'date']).isRequired,
	name: PropTypes.string.isRequired,
	value: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	]),
	required: PropTypes.bool,
	placeholder: PropTypes.string,
	maxLength: PropTypes.number,
	changeHandler: PropTypes.func,
	min: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	]),
	max: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
	]),
	pattern: PropTypes.string,
	className: PropTypes.string,
	textRef: PropTypes.any,
	step: PropTypes.number,
	minLength: PropTypes.number,
	information: PropTypes.string,
};

Text.defaultProps = {
	hideLabel: false,
	type: 'text',
	required: false,
	maxLength: 200,
	max: 1000000,
	min: 0,
	step: 1,
};

export default Text;