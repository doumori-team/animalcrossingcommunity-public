import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

import { constants } from '@utils';

import {
	avatarBackgroundShape,
	avatarColorationShape,
	avatarCharacterShape,
	avatarAccentShape,
	avatarTagShape
} from '@propTypes';
import { Pagination } from '@layout';
import { Select, Checkbox, Check } from '@form';
import Avatar from '@/components/nodes/Avatar.js';

/* Component that allows users to select element of specified type.
 *
 * Parameters:
 * 	- elements: array of objects representing available character/accent/background. Required.
 * 	- currElement: object representing currently selected character/accent/background. Required.
 *	- elementType: string representing type of element ('character'|'accent'|'background'). Required.
 *	- colorations: array of objects representing available colorations. Only used if elementType = 'background'.
 * 	- currColoration: object representing current background color the user has (if any).
 * 	- currAccentPosition: id of position of current accent the user has (if applicable).
 * 	- onElementChange: function that updates avatar preview when a new element is chosen. Required.
 *	- onColorationChange: function that updates avatar preview coloration when it changes. Only used if elementType = 'background'.
 * 	- tags: array of objects representing filter tags. Required.
 */
const AvatarSelector = ({elements, currElement, elementType, colorations, tags,
	currColoration, currAccentPosition, onElementChange, onColorationChange, onAccentPositionChange}) =>
{
	const [currPage, setCurrPage] = useState(1);
	const [filters, setFilters] = useState([]);
	const ref = useRef(null);

	let nextIndex = 1;
	const pageSize = 40;

	const handlePageChange = (pageNumber) =>
	{
		setCurrPage(pageNumber);

		ref.current?.scroll({
			top: 0,
			behavior: 'smooth'
		});
	}

	const handleFilterChange = (newFilters) =>
	{
		setFilters(newFilters);
		setCurrPage(1);
	}

	const handleElementChange = (element) =>
	{
		onElementChange(element);
	}

	const handleColorationChange = (event) =>
	{
		onColorationChange(event);
	}

	const handleAccentPositionChange = (event) =>
	{
		onAccentPositionChange(event);
	}

	const matchesFilters = (element) =>
	{
		for (let i = 0; i < filters.length; i++)
		{
			if (!element.tags.find(t => t === filters[i]))
			{
				return false;
			}
		}

		return true;
	}

	return (
		<div className='AvatarSelector'>
			<Select
				name='filters'
				label='Filters'
				hideLabel
				multiple
				options={tags}
				optionsMapping={{value: 'id', label: 'name'}}
				placeholder='Choose filters...'
				changeHandler={handleFilterChange}
				isOptionDisabled={(option) => filters.length >= 3}
			/>

			{elementType === 'background' && (
				<div className='AvatarSelector_colorationContainer'>
					<Select
						name='colorationId'
						label='Coloration'
						changeHandler={handleColorationChange}
						value={currColoration ? currColoration.id : ''}
						options={[{id: '', name: 'None'}].concat(colorations)}
						optionsMapping={{value: 'id', label: 'name'}}
					/>
				</div>
			)}

			{elementType === 'accent' && (
				<div className='AvatarSelector_accentOptionContainer'>
					<div className='AvatarSelector_noAccent'>
						<label htmlFor='a_none' data-selected={!currElement}>
							<Checkbox
								label='No accent'
								name='accentId'
								type='radio'
								value=''
								checked={!currElement}
								clickHandler={handleElementChange.bind(this, '')}
							/>
						</label>
					</div>
					<Check
						options={constants.avatarAccentPositions}
						name='accentPosition'
						defaultValue={currAccentPosition ? [currAccentPosition] : [4]}
						imageLocation='form'
						useImageFilename
						hideName
						label='Position'
						onChangeHandler={handleAccentPositionChange}
					/>
				</div>
			)}

			<div className='AvatarSelector_optionContainer' ref={ref}>
				{elements.map(element => {
					let displayID = null;

					if (matchesFilters(element))
					{
						displayID = nextIndex;
						nextIndex++;
					}

					let displayed = !!displayID &&
						Math.ceil(displayID / pageSize) === currPage;

					return (
						<AvatarSelectorOption
							element={element}
							elementType={elementType}
							currColoration={currColoration}
							currAccentPosition={currAccentPosition}
							displayed={displayed}
							selected={!!currElement && element.id === currElement.id}
							onChange={handleElementChange.bind(this, element)}
							key={elementType.charAt(0) + element.id}
						/>
					);
				})}
			</div>

			{nextIndex === 1 ? (
				<div>No matching avatars found.</div>
			) : (
				<Pagination
					page={currPage}
					pageSize={pageSize}
					totalCount={nextIndex - 1}
					onPageChange={handlePageChange}
				/>
			)}
		</div>
	);
}

AvatarSelector.propTypes = {
	elements: PropTypes.arrayOf(PropTypes.oneOfType([
		PropTypes.shape(avatarCharacterShape),
		PropTypes.shape(avatarAccentShape),
		PropTypes.shape(avatarBackgroundShape)
	])).isRequired,
	currElement: PropTypes.oneOfType([
		PropTypes.shape(avatarCharacterShape),
		PropTypes.shape(avatarAccentShape),
		PropTypes.shape(avatarBackgroundShape)
	]),
	elementType: PropTypes.oneOf(['character', 'accent', 'background']).isRequired,
	colorations: PropTypes.arrayOf(avatarColorationShape),
	currColoration: avatarColorationShape,
	currAccentPosition: PropTypes.number,
	onElementChange: PropTypes.func.isRequired,
	onColorationChange: PropTypes.func,
	onAccentPositionChange: PropTypes.func,
	tags: PropTypes.arrayOf(avatarTagShape).isRequired
}

/* Displays individual element options in AvatarSelector.
 *
 * Parameters:
 * 	- element: object representing character/accent/background option. Required.
 *	- elementType: string representing type of element ('character'|'accent'|'background'). Required.
 * 	- currColoration: object representing current background color the user has (if any).
 * 	- currAccentPosition: id of position of current accent the user has (if applicable).
 * 	- displayed: boolean representing whether to show option. Required.
 * 	- selected: boolean representing whether option is being used in current preview. Required.
 * 	- onChange: function that updates avatar preview when a new element is chosen. Required.
 */
const AvatarSelectorOption = ( {element, elementType, currColoration, currAccentPosition, displayed, selected, onChange}) =>
{
	let className = 'AvatarSelectorOption';

	if (!displayed)
	{
		className += ' AvatarSelectorOption-inactive';
	}

	if (selected)
	{
		className += ' AvatarSelectorOption-selected';
	}

	const id = elementType.charAt(0) + element.id;

	let formName = '';

	switch(elementType)
	{
		case 'background': formName = 'backgroundId'; break;
		case 'character': formName = 'characterId'; break;
		case 'accent': formName = 'accentId'; break;
	}

	const avatarComponents = {
		background: elementType === 'background' ? element : null,
		coloration: (elementType === 'background' && element.colorable) ? currColoration : null,
		character: elementType === 'character' ? element : null,
		accent: elementType === 'accent' ? element : null,
		accentPosition: (elementType === 'accent' && element.positionable) ? currAccentPosition : null
	};

	return (
		<div className={className}>
			<label htmlFor={id}>
				<Checkbox
					type='radio'
					name={formName}
					htmlFor={id}
					value={element.id}
					checked={selected}
					clickHandler={onChange}
					label={element.name}
					hideLabel
				/>
				<div className='AvatarSelectorOption_elementContainer' data-element-type={elementType}>
					<Avatar {...avatarComponents} />
				</div>
				<span className='AvatarSelectorOption_name'>
					{element.name}
				</span>
			</label>
		</div>
	);
}

AvatarSelectorOption.propTypes = {
	element: PropTypes.oneOfType([
		PropTypes.shape(avatarCharacterShape),
		PropTypes.shape(avatarAccentShape),
		PropTypes.shape(avatarBackgroundShape)
	]).isRequired,
	elementType: PropTypes.oneOf(['character', 'accent', 'background']).isRequired,
	currColoration: avatarColorationShape,
	currAccentPosition: PropTypes.number,
	displayed: PropTypes.bool.isRequired,
	selected: PropTypes.bool.isRequired,
	onChange: PropTypes.func.isRequired
}

export default AvatarSelector;