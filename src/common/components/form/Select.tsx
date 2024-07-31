import React, { useState } from 'react';
import ReactSelect, { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import { RequireClientJS } from '@behavior';
import { ChangeHandlerSelectType, ChangeHandleValueType } from '@types';

const Input = (props:any) => {
    return <components.Input
        {...props}
        data-lpignore='true'
        autoComplete='off'
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
const Select = ({
	hideLabel = false,
	label,
	multiple = false,
	name,
	useReactSelect = false,
	value,
	changeHandler,
	async = false,
	groupBy = '',
	required = false,
	options = [],
	optionsMapping,
	placeholder,
	option,
	isOptionDisabled,
	htmlFor,
	size = 4,
	loadOptionsHandler
}: SelectProps) =>
{
    const [inputValue, setInputValue] = useState<any>(value || value === 0 ? (multiple && Array.isArray(value) ? value.join() : value) : '');

    const updateSelect = (so: any) : void =>
    {
        const value = multiple ? Array.from(so, (option:any) => option.value) : so.value;
        const newInputValue = multiple && Array.isArray(value) ? value.join() : value;

        setInputValue(newInputValue);

        if (changeHandler)
        {
            changeHandler(value);
        }
    }

    // for Async Select
    const loadOptions = async (inputValue:string, callback:(options: any[]) => void, showOptions: any[]) : Promise<void> =>
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
                returnedOptions.map((option:any) => ({
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
            // have direct match show first in the list
            callback(showOptions.filter(option => option.label.toLowerCase() === inputValue.toLowerCase()).concat(showOptions.filter(option => option.label.toLowerCase() !== inputValue.toLowerCase() && option.label.toLowerCase().includes(inputValue.toLowerCase()))));
        }
    }

    const getSelects = () =>
    {
        // Option & SingleValue works with ReactSelect for any custom option modifiers

        const Option = (props:any) => {
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
        const SingleValue = (props:any) => {
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
            options.map((option:any) => ({
                value: option[optionsMapping.value],
                label: typeof optionsMapping.label === 'string' ?
                    option[optionsMapping.label] :
                    optionsMapping.label(option),
                [groupBy]: groupBy ? option[groupBy] : '',
                css: option.hasOwnProperty('css') ? option.css : '',
            })) :
            options;

        const defaultValue = value || value === 0 ? (multiple && Array.isArray(value) ?
            showOptions
                .filter((x:any) => value?.includes(x.value)) :
            (useReactSelect || async ? showOptions
                .find((x:any) => value === x.value) : value)) : (multiple ? [] : '');

        return (
            <>
            {async && (
                <RequireClientJS fallback={
                    getGroupSelect(defaultValue, showOptions)
                }>
                    <AsyncSelect
                        cacheOptions
                        loadOptions={(inputValue:string, callback:(options: any[]) => void): Promise<any> =>
                            loadOptions(inputValue, callback, showOptions)}
                        name={name}
                        isMulti={multiple}
                        defaultValue={defaultValue}
                        placeholder={placeholder}
                        noOptionsMessage={({inputValue}) => !inputValue ?
                            `Start typing to lookup ${label}` :
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

    const getSelect = (defaultValue:any, showOptions:any[], changeHandler?:ChangeHandlerSelectType) =>
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

    const getGroupSelect = (defaultValue:any, showOptions:any[], changeHandler?:ChangeHandlerSelectType) =>
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
    const getOptgroupTags = (options:any[]) =>
    {
        let uniqueGroups:any = {};

        if (options !== undefined)
        {
            options.map((option:any) => {
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
    const getOptionTags = (options:any[]) =>
    {
        return (
            options.map((option:any) =>
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

type SelectProps = {
	hideLabel?: boolean
	label: string
	async?: boolean
	multiple?: boolean
	groupBy?: string
	name?: string
	value?: string | number | any[] | null
	required?: boolean
	options?: any
	optionsMapping?: {
		value: string
		label: string | Function
	}
	placeholder?: string
	changeHandler?: ChangeHandlerSelectType | ChangeHandleValueType
	useReactSelect?: boolean
	option?: Function
	size?: number
	isOptionDisabled?: (option: any, selectValue: any) => boolean
	loadOptionsHandler?: Function
    htmlFor?: string
};

export default Select;