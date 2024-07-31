import React from 'react';

import { Form, Select, Text, Switch } from '@form';
import { GameType, GameConsoleType } from '@types';
import { constants } from '@utils';

const EditGame = ({
	gameConsole,
	game,
	gameConsoles,
	games
}: EditGameProps) =>
{
	var gamesSequence = games
		.filter(item => item.sequence !== null)
		.map(item => {
			const text = (game && item.sequence == game.sequence)
				? `Current Position`
				: (!game || game.sequence === null || item.sequence < game.sequence)
					? `Before ${item.name}`
					: `After ${item.name}`;

			return {sequence: item.sequence, text};
	});

	if (!game || game.sequence === null)
	{
		gamesSequence.push({
			sequence: gamesSequence.length + 1,
			text: `(Last Prioritized Game)`
		});
	}

	return (
		<div className='EditGame'>
			<Form
				action='v1/admin/game/save'
				callback={`/admin/game-console/${encodeURIComponent(gameConsole.id)}`}
				showButton
			>
				<input type='hidden' name='id' value={game ? game.id : ''} />

				<Form.Group>
					<Select
						name='gameConsoleId'
						label='Game Console'
						value={gameConsole ? gameConsole.id : ''}
						options={gameConsoles}
						optionsMapping={{value: 'id', label: 'name'}}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='name'
						label='Name'
						value={game ? game.name : ''}
						required
						maxLength={constants.max.gameName}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='shortName'
						label='Short Name'
						value={game ? game.shortName : ''}
						required
						maxLength={constants.max.gameName}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='pattern'
						label='Pattern'
						value={game ? game.pattern : ''}
						placeholder='^[0-9]{4}-[0-9]{4}-[0-9]{4}$'
						required
						maxLength={constants.max.gamePattern}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='placeholder'
						label='Placeholder'
						value={game ? game.placeholder : ''}
						placeholder='0000-0000-0000'
						required
						maxLength={constants.max.gamePlaceholder}
					/>
				</Form.Group>

				<Form.Group>
					<Select
						name='sequence'
						label='Sequence'
						value={game && game.sequence ? game.sequence : 0}
						options={gamesSequence.concat([
							{sequence: 0, label: '(Sort Alphabetically)'} as any
						])}
						optionsMapping={{
							value: 'sequence',
							label: (item:any) => {
								if (item.hasOwnProperty('label'))
								{
									return item.label;
								}

								return `${item.sequence} - ${item.text}`
							},
						}}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='isEnabled'
						label='Enabled'
						value={game ? game.isEnabled : true}
					/>
				</Form.Group>
			 </Form>
		</div>
	);
}

type EditGameProps = {
	gameConsole: GameConsoleType
	game?: GameType
	gameConsoles: GameConsoleType[]
	games: GameType[]
};

export default EditGame;
