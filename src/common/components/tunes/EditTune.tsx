import React from 'react';

import { Form, Check, Text } from '@form';
import { TuneType, TownType } from '@types';
import { utils, constants } from '@utils';

const EditTune = ({
	townId,
	tune,
	userId
}: EditTuneProps) =>
{
	let callback = '/town-tunes';

	if (townId != null && townId > 0 && userId != null)
	{
		callback = `/profile/${encodeURIComponent(userId)}/towns`;
	}

	let notes = [];

	if (tune && tune.notes && tune.notes.length > 0)
	{
		notes = tune.notes.slice();
	}
	else
	{
		notes = [9, 14, 1, 9, 8, 13, 1, 11, 12, 0, 15, 0, 5, 1, 0, 0];
	}

	return (
		<div className='EditTune'>
			<Form action='v1/tune/save' callback={callback} showButton>
				<input type='hidden' name='townId' value={townId ? townId : 0} />
				<input type='hidden' name='id' value={tune ? tune.id : 0} />

				<Form.Group>
					<Text
						label='Tune Name'
						name='tuneName'
						value={tune ? tune.name : ''}
						maxLength={constants.max.tuneName}
						className='text-full'
					/>
				</Form.Group>

				<h3>Notes:</h3>
				{notes.map((note, index) =>
					<div className='EditTune_notes' key={index}>
						<Form.Group>
							<Check
								options={utils.getTownTunes()}
								optionsMapping={{id: 'id', name: 'name', filename: 'img_name'}}
								name={`noteId${index}`}
								defaultValue={[note]}
								required
								imageLocation='tunes'
								useImageFilename
								hideName
								label={`Note #${index+1}`}
							/>
						</Form.Group>
					</div>
				)}
			</Form>
		</div>
	);
}

type EditTuneProps = {
	townId?: number
	tune?: TuneType|NonNullable<TownType['tune']>
	userId?: number
};

export default EditTune;