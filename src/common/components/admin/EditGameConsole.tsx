import React from 'react';

import { Form, Text, Select, Switch } from '@form';
import { GameConsoleType } from '@types';
import { constants } from '@utils';

const EditGameConsole = ({
	gameConsole,
	gameConsoles
}: EditGameConsoleProps) =>
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
							label: (system:any) => {
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

type EditGameConsoleProps = {
	gameConsole?: GameConsoleType
	gameConsoles: GameConsoleType[]
};

export default EditGameConsole;
