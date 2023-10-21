import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ReactSelect, { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import RequireClientJS from '@/components/behavior/RequireClientJS.js';

const Input = (props) => {
	return <components.Input
		{...props}
		data-lpignore='true'
	/>;
}

/**
 * Handles: Simple Select, Multiple Select, Group Select, Async Select
 *
 * If setting up new select, best to see how others have it setup to understand.
 *
 * Some examples:
 * - Simple Select: Trading Post, Game(s)
 * - Multiple (ReactSelect) Select: Trading Post, Villager(s)
 * - Group Select: Pattern Maker, Palettes
 * - Async Select: Trading Post, Item(s)
 * - Forced ReactSelect Simple Select: Trade, choosing Character
 * - Colored Simple Select Options: Profile Avatar Selector, Colorations
 */
const Select = ({hideLabel, label, multiple, name, useReactSelect, value, changeHandler,
	async, groupBy, required, options, optionsMapping, placeholder, option, isOptionDisabled,
	htmlFor, size, loadOptionsHandler}) =>
{
	const [inputValue, setInputValue] = useState(value || value === 0 ? (multiple ? value.join() : value) : '');

	const updateSelect = (so) =>
	{
		const value = multiple ? Array.from(so, option => option.value) : so.value;
		const inputValue = multiple ? value.join() : value;

		setInputValue(inputValue);

		if (changeHandler)
		{
			changeHandler(value);
		}
	}

	// for Async Select
	const loadOptions = async (inputValue, callback, showOptions) =>
	{
		if (inputValue.length < 3)
		{
			callback([]);
			return;
		}

		if (loadOptionsHandler)
		{
			const returnedOptions = await loadOptionsHandler(inputValue);

			callback(optionsMapping ?
				returnedOptions.map(option => ({
					value: option[optionsMapping.value],
					label: typeof optionsMapping.label === 'string' ?
						option[optionsMapping.label] :
						optionsMapping.label(option),
					[groupBy]: groupBy ? option[groupBy] : '',
					css: option.hasOwnProperty('css') ? option.css : '',
				})) :
				returnedOptions);
		}
		else
		{
			callback(showOptions.filter(option =>
				option.label.toLowerCase().includes(inputValue.toLowerCase())
			));
		}
	}

	const getSelects = () =>
	{
		// Option & SingleValue works with ReactSelect for any custom option modifiers

		const Option = (props) => {
			return (
				<components.Option {...props}>
					{option ? (
						option(props.data.value)
					) : (
						props.data.label
					)}
				</components.Option>
			);
		};

		// selected value
		const SingleValue = (props) => {
			return (
				<components.SingleValue {...props}>
					{option ? (
						option(props.data.value)
					) : (
						props.data.label
					)}
				</components.SingleValue>
			);
		};

		// Allows us to change the options into something all the selects will understand
		const showOptions = optionsMapping ?
			options.map(option => ({
				value: option[optionsMapping.value],
				label: typeof optionsMapping.label === 'string' ?
					option[optionsMapping.label] :
					optionsMapping.label(option),
				[groupBy]: groupBy ? option[groupBy] : '',
				css: option.hasOwnProperty('css') ? option.css : '',
			})) :
			options;

		const defaultValue = value || value === 0 ? (multiple ?
			showOptions
				.filter(x => value?.includes(x.value)) :
			(useReactSelect || async ? showOptions
				.find(x => value === x.value) : value)) : (multiple ? [] : '');

		return (
			<>
			{async && (
				<RequireClientJS fallback={
					getGroupSelect(defaultValue, showOptions)
				}>
					<AsyncSelect
						cacheOptions
						loadOptions={(inputValue, callback) =>
							loadOptions(inputValue, callback, showOptions)}
						name={name}
						isMulti={multiple}
						defaultValue={defaultValue}
						placeholder={placeholder}
						noOptionsMessage={({inputValue}) => !inputValue ?
							`Start typing to lookup ${name}` :
							'No results found'}
						id={name}
						components={{ Input }}
						onChange={so => updateSelect(so)}
						className='react-select'
						isOptionDisabled={isOptionDisabled}
						aria-label={label}
					/>
				</RequireClientJS>
			)}
			{(!(async || multiple) && groupBy) && (
				getGroupSelect(defaultValue, showOptions, changeHandler)
			)}
			{(!async && (multiple || useReactSelect)) && (
				<RequireClientJS fallback={
					getGroupSelect(defaultValue, showOptions)
				}>
					<ReactSelect
						name={name}
						isMulti={multiple}
						defaultValue={defaultValue}
						options={showOptions}
						placeholder={placeholder}
						id={name}
						components={{ Input, Option, SingleValue }}
						onChange={so => updateSelect(so)}
						className='react-select'
						isOptionDisabled={isOptionDisabled}
						aria-label={label}
					/>
				</RequireClientJS>
			)}
			{!(async || multiple || useReactSelect || groupBy) && (
				getSelect(defaultValue, showOptions, changeHandler)
			)}
			{(required && (async || multiple || useReactSelect)) && (
				<input
					tabIndex={-1}
					style={{
						opacity: 0,
						width: "100%",
						height: 0
					}}
					onChange={() => {}}
					value={inputValue}
					required
				/>
			)}
			</>
		)
	}

	const getSelect = (defaultValue, showOptions, changeHandler) =>
	{
		return (
			changeHandler ? (
				<RequireClientJS fallback={getSelect(defaultValue, showOptions)}>
					<select
						name={name}
						defaultValue={defaultValue}
						required={required}
						onChange={changeHandler}
						aria-label={label}
						id={name}
					>
						{placeholder && (
							<option value='' disabled>
								{placeholder}
							</option>
						)}
						{showOptions.map(option =>
							<option
								key={option.value}
								value={option.value}
								data-bg-coloration={option.css ? option.css : ''}
							>
								{option.label}
							</option>
						)}
					</select>
				</RequireClientJS>
			) : (
				<select
					name={name}
					defaultValue={defaultValue}
					required={required}
					aria-label={label}
					id={name}
				>
					{placeholder && (
						<option value='' disabled>
							{placeholder}
						</option>
					)}
					{showOptions.map(option =>
						<option
							key={option.value}
							value={option.value}
							data-bg-coloration={option.css ? option.css : ''}
						>
							{option.label}
						</option>
					)}
				</select>
			)
		);
	}

	const getGroupSelect = (defaultValue, showOptions, changeHandler) =>
	{
		const usePlaceholder = multiple ? '' : placeholder;
		const useSize = multiple ? size : 1;

		return (
			changeHandler ? (
				<RequireClientJS fallback={getGroupSelect(defaultValue, showOptions)}>
					<select
						name={name}
						defaultValue={defaultValue}
						onChange={changeHandler}
						multiple={multiple}
						required={required}
						aria-label={label}
						id={htmlFor}
						size={useSize}
					>
						{usePlaceholder && (
							<option value='' disabled>
								{usePlaceholder}
							</option>
						)}
						{groupBy ?
							getOptgroupTags(showOptions) :
							getOptionTags(showOptions)}
					</select>
				</RequireClientJS>
			) : (
				<select
					name={name}
					defaultValue={defaultValue}
					multiple={multiple}
					required={required}
					aria-label={label}
					id={htmlFor}
					size={useSize}
				>
					{usePlaceholder && (
						<option value='' disabled>
							{usePlaceholder}
						</option>
					)}
					{groupBy ?
						getOptgroupTags(showOptions) :
						getOptionTags(showOptions)}
				</select>
			)
		);
	}

	// for Group Select
	const getOptgroupTags = (options) =>
	{
		const uniqueGroups = {};

		if (options !== undefined)
		{
			options.map(option => {
				let groupName = option[groupBy];

				if (!uniqueGroups[groupName])
				{
					uniqueGroups[groupName] = [option];
				}
				else
				{
					uniqueGroups[groupName].push(option);
				}
			});
		}

		return (
			Object.keys(uniqueGroups).map(index => {
				var children = getOptionTags(uniqueGroups[index]);

				return (
					<optgroup key={index} label={index} >
						{children}
					</optgroup>
				);
			})
		);
	}

	// for Group Select
	const getOptionTags = (options) =>
	{
		return (
			options.map(option =>
				<option
					key={option.value}
					value={option.value}
				>
					{option.label}
				</option>
			)
		);
	}

	return (
		<>
		{!hideLabel && (
			<label htmlFor={name}>{label}:</label>
		)}
		<RequireClientJS fallback={
			<div className={`Select${multiple ? '-multiple' : ''} simple-select`}>
				{getSelects()}
			</div>
		}>
			<div className={`Select${multiple ? '-multiple' : ''}${useReactSelect || async ? '' : ' simple-select'}`}>
				{getSelects()}
			</div>
		</RequireClientJS>
		</>
	);
}

Select.propTypes = {
	hideLabel: PropTypes.bool,
	label: PropTypes.string.isRequired,
	async: PropTypes.bool,
	multiple: PropTypes.bool,
	groupBy: PropTypes.string,
	name: PropTypes.string,
	value: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number,
		PropTypes.array,
	]),
	required: PropTypes.bool,
	options: PropTypes.array,
	optionsMapping: PropTypes.shape({
		value: PropTypes.string.isRequired,
		label: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.func,
		]).isRequired,
	}),
	placeholder: PropTypes.string,
	changeHandler: PropTypes.func,
	useReactSelect: PropTypes.bool,
	option: PropTypes.func,
	size: PropTypes.number,
	isOptionDisabled: PropTypes.func,
	loadOptionsHandler: PropTypes.func,
};

Select.defaultProps = {
	hideLabel: false,
	async: false,
	multiple: false,
	groupBy: '',
	required: false,
	options: [],
	useReactSelect: false,
	size: 4,
};

export default Select;