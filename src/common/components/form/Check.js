import React from 'react';
import PropTypes from 'prop-types';

import { utils, constants } from '@utils';

const Check = ({hideLabel, options, defaultValue, multiple, name, required,
	imageLocation, hideName, useImageFilename, onChangeHandler, label,
	optionsMapping}) =>
{
	const showOptions = optionsMapping ? options.map(option => ({
		id: option[optionsMapping.id],
		name: typeof optionsMapping.name === 'string' ?
			option[optionsMapping.name] :
			optionsMapping.name(option),
		filename: optionsMapping.hasOwnProperty('filename') ?
			option[optionsMapping.filename] :
			'',
	})) : options;

	return (
		<>
		{!hideLabel && (
			<label htmlFor={name}>{label}:</label>
		)}
		<div className='Check'>
			{showOptions.map(option => {
				const key = `${name}_${option.id}`;

				return (
					<React.Fragment key={key}>
						<input
							type={multiple ? 'checkbox' : 'radio'}
							name={name}
							id={key}
							value={option.id}
							className='Check_input'
							defaultChecked={defaultValue.includes(option.id)}
							required={required}
							onClick={onChangeHandler}
							aria-label={label}
						/>
						<label htmlFor={key} className='Check_option'>
							{utils.realStringLength(imageLocation) > 0 &&
								<img
									src={`${constants.AWS_URL}/images/${imageLocation}/${useImageFilename ?
										option.filename :
										utils.convertForUrl(option.name)+'.png'}`}
									width={option.width ? option.width : ''}
									height={option.height ? option.height : ''}
									alt={option.name ? option.name : option.filename}
								/>
							}
							{!hideName && (
								<span>{option.name}</span>
							)}
						</label>
					</React.Fragment>
				);
			})}
			</div>
		</>
	);
}

Check.propTypes = {
	options: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.any.isRequired,
		filename: PropTypes.string,
		name: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
	})).isRequired,
	defaultValue: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.array,
	]).isRequired,
	multiple: PropTypes.bool,
	name: PropTypes.string.isRequired,
	required: PropTypes.bool,
	imageLocation: PropTypes.string,
	hideName: PropTypes.bool,
	useImageFilename: PropTypes.bool,
	onChangeHandler: PropTypes.func,
	label: PropTypes.string.isRequired,
	optionsMapping: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		filename: PropTypes.string,
	}),
	hideLabel: PropTypes.bool,
}

Check.defaultProps = {
	multiple: false,
	required: false,
	hideName: false,
	useImageFilename: false,
	hideLabel: false,
}

export default Check;