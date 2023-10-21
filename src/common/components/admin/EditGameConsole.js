import React from 'react';
import PropTypes from 'prop-types';

import { Form, Text, Select, Switch } from '@form';
import { gameConsoleShape } from '@propTypes';
import { constants } from '@utils';

const EditGameConsole = ({gameConsole, gameConsoles}) =>
{
	var gameConsolesSequence = gameConsoles.map(system => {
		const text = (gameConsole && gameConsole.id == system.id)
			? `Current Position`
			: (!gameConsole || system.sequence < gameConsole.sequence)
				? `Before ${system.name}`
				: `After ${system.name}`;

		return {sequence: system.sequence, text};
	});

	if (!gameConsole)
	{
		gameConsolesSequence.push({
			sequence: gameConsolesSequence.length + 1,
			text: `(New Game Console)`
		});
	}

	return (
		<div className='EditGameConsole'>
			<Form action='v1/admin/game_console/save' callback='/admin/game-consoles' showButton>
				<input type='hidden' name='id' value={gameConsole ? gameConsole.id : ''} />

				<Form.Group>
					<Text
						name='name'
						label='Console Name'
						value={gameConsole ? gameConsole.name : ''}
						required
						maxLength={constants.max.gameName}
					/>
				</Form.Group>

				<Form.Group>
					<Select
						name='sequence'
						label='Sequence'
						value={gameConsole
							? gameConsole.sequence
							: gameConsoles.length + 1}
						options={gameConsolesSequence}
						optionsMapping={{
							value: 'sequence',
							label: (system) => {
								return `${system.sequence} - ${system.text}`
							},
						}}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='isLegacy'
						label='Legacy Console'
						value={gameConsole ? gameConsole.isLegacy : false}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='isEnabled'
						label='Enabled'
						value={gameConsole ? gameConsole.isEnabled : false}
					/>
				</Form.Group>
			 </Form>
		</div>
	);
}

EditGameConsole.propTypes = {
	gameConsole: gameConsoleShape,
	gameConsoles: PropTypes.arrayOf(gameConsoleShape),
};

export default EditGameConsole;
