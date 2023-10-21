import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import RequireClientJS from '@/components/behavior/RequireClientJS.js';
import { constants } from '@utils';
import Button from '@/components/form/Button.js';
import Text from '@/components/form/Text.js';

const EditKeyboard = ({name, defaultValue, required, label}) =>
{
	const textInput = useRef(null);

	const doSpecialCharacter = (e, tag) =>
	{
		e.preventDefault();

		textInput.current.value += '[' + tag + ']';
		textInput.current.focus();
	}

	return (
		<div className='EditKeyboard'>
			<RequireClientJS>
				<div className='EditKeyboard_markup'>
					{constants.town.keyboardConfig.map(k =>
						<Button
							key={k.character}
							label={k.character}
							title={k.title}
							clickHandler={e => doSpecialCharacter(e, k.character)}
						>
							<img
								src={`${process.env.AWS_URL}/images/keyboard/${k.filename}.png`}
								alt={k.character}
							/>
						</Button>
					)}
				</div>
			</RequireClientJS>

			<Text
				name={name}
				value={defaultValue}
				required={required}
				textRef={textInput}
				maxLength={constants.max.keyboardName}
				label={label}
				className='text-full'
				hideLabel
				placeholder={label}
			/>
		</div>
	);
}

EditKeyboard.propTypes = {
	name: PropTypes.string.isRequired,
	defaultValue: PropTypes.string,
	required: PropTypes.bool,
	label: PropTypes.string.isRequired,
};

export default EditKeyboard;
