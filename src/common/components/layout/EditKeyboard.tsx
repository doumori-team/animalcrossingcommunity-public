import React, { useRef } from 'react';

import { RequireClientJS } from '@behavior';
import { constants } from '@utils';
import { Text, Button } from '@form';

const EditKeyboard = ({
	name,
	defaultValue,
	required,
	label
}: EditKeyboardProps) =>
{
	const textInput = useRef<HTMLInputElement>(null);

	const doSpecialCharacter = (e: React.ChangeEvent<HTMLInputElement>, tag: string) : void =>
	{
		e.preventDefault();

		if (textInput.current == null)
		{
			return;
		}

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
							clickHandler={(e: any) => doSpecialCharacter(e, k.character)}
						>
							<img
								src={`${constants.AWS_URL}/images/keyboard/${k.filename}.png`}
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

type EditKeyboardProps = {
	name: string
	defaultValue?: string
	required?: boolean
	label: string
};

export default EditKeyboard;
