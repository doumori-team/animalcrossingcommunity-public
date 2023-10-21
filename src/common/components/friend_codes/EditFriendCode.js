import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { RequireClientJS } from '@behavior';
import { Form, Select, Text } from '@form';
import { characterShape, friendCodeShape, fcGameShape } from '@propTypes';
import { Keyboard, ErrorMessage } from '@layout';

const EditFriendCode = ({friendCode, games, characters}) =>
{
	const [placeholder, setPlaceholder] = useState(friendCode ? friendCode.placeholder : '');
	const [pattern, setPattern] = useState(friendCode ? friendCode.pattern : false);
	const [selectedCharacters, setSelectedCharacters] = useState(friendCode ? characters.filter(c => c.game.id === friendCode.game.acGameId) : []);

	const changePattern = (event) =>
	{
		const game = games.find(game => game.id === Number(event.target.value));

		setPlaceholder(game.placeholder);
		setPattern(game.pattern);
		setSelectedCharacters(characters.filter(c => c.game.id === game.acGameId));
	}

	return (
		<div className='EditFriendCode'>
			<Form
				action='v1/friend_code/save'
				callback='/profile/:userId/friend-codes'
				showButton={!!placeholder}
			>
				<input type='hidden' name='id' value={friendCode ? friendCode.id : ''} />

				<div className='EditFriendCode_game'>
					{!friendCode ? (
						<RequireClientJS fallback={
							<ErrorMessage identifier='javascript-required' />
						}>
							<Form.Group>
								<Select
									label='Game'
									name='gameId'
									options={games}
									optionsMapping={{value: 'id', label: 'name'}}
									groupBy='consoleName'
									placeholder='Select game...'
									changeHandler={changePattern}
									required
								/>
							</Form.Group>
						</RequireClientJS>
					) : (
						<>
							<input type='hidden' name='gameId' value={friendCode.game.id} />

							<label htmlFor='code'>
								{friendCode.name}
							</label>
						</>
					)}
				</div>

				{placeholder && (
					<div className='EditFriendCode_codeSection'>
						<Form.Group>
							<Text
								name='code'
								required
								label='Friend Code'
								placeholder={placeholder}
								value={friendCode ? friendCode.code : ''}
								pattern={pattern ? pattern : ''}
							/>
						</Form.Group>

						{selectedCharacters.length > 0 && (
							<Form.Group>
								<Select
									name='characterId'
									value={friendCode && friendCode.character ? friendCode.character.id : 0}
									label='Character'
									options={[{id: 0, label: 'None'}].concat(selectedCharacters)}
									optionsMapping={{
										value: 'id',
										label: (character) => {
											if (character.hasOwnProperty('label'))
											{
												return character.label;
											}

											return (
												`${character.name} (${character.town.name})`
											);
										}
									}}
									useReactSelect
									option={
										(value) => {
											if (value === 0)
											{
												return 'None';
											}

											const character = selectedCharacters.find(c => c.id === value);

											return (
												<>
												<Keyboard
													name={character.name}
													gameId={character.game.id}
												/> (<Keyboard
													name={character.town.name}
													gameId={character.game.id}
												/>)
												</>
											);
										}
									}
								/>
							</Form.Group>
						)}
					</div>
				)}
			</Form>
		</div>
	);
}

EditFriendCode.propTypes = {
	friendCode: friendCodeShape,
	games: PropTypes.arrayOf(fcGameShape),
	characters: PropTypes.arrayOf(characterShape),
}

export default EditFriendCode;
