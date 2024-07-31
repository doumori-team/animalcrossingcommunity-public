import React from 'react';

import { utils, constants } from '@utils';
import { ClickHandlerType } from '@types';

const Check = ({
	hideLabel = false,
	options,
	defaultValue,
	multiple = false,
	name,
	required = false,
	imageLocation,
	hideName = false,
	useImageFilename = false,
	onChangeHandler,
	label,
	optionsMapping
}: CheckProps) =>
{
	const showOptions = optionsMapping ? options.map((option:any) => ({
		id: option[optionsMapping.id],
		name: typeof optionsMapping.name === 'string' ?
			option[optionsMapping.name] :
			optionsMapping.name(option),
		filename: (optionsMapping.hasOwnProperty('filename') && optionsMapping.filename != null) ?
			option[optionsMapping.filename] :
			'',
		width: null,
		height: null,
	})) : options;

	return (
		<>
		{!hideLabel && (
			<label htmlFor={name}>{label}:</label>
		)}
		<div className='Check'>
			{showOptions.map((option:any) => {
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

type CheckProps = {
	options: {
		id: any
		filename?: string
		name?: string
		width?: number
		height?: number
	}[] | any
	defaultValue: string | any[]
	multiple?: boolean
	name: string
	required?: boolean
	imageLocation?: string
	hideName?: boolean
	useImageFilename?: boolean
	onChangeHandler?: ClickHandlerType
	label: string
	optionsMapping?: {
		id: string
		name: any
		filename?: string
	}
	hideLabel?: boolean
};

export default Check;