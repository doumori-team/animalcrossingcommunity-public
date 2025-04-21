import { useState } from 'react';

import { Form, Text, Switch, Button } from '@form';
import { PollType } from '@types';
import { dateUtils, constants } from '@utils';
import { InnerSection } from '@layout';
import { RequireClientJS } from '@behavior';
import { ErrorMessage } from '@layout';

const EditPoll = ({
	id,
	question,
	description,
	startDate,
	duration,
	isMultipleChoice,
	isEnabled,
	options,
}: EditPollProps) =>
{
	const [curOptions, setCurOptions] = useState<any>(options ? options : [
		{ description: '' },
		{ description: '' },
	]);

	const addOption = (): void =>
	{
		let newOptions = [...curOptions];
		newOptions.push({ description: '' });

		setCurOptions(newOptions);
	};

	const deleteOption = (index: number): void =>
	{
		let newOptions = [...curOptions];
		newOptions.splice(index, 1);

		setCurOptions(newOptions);
	};

	return (
		<div className='EditPoll'>
			<Form action='v1/admin/poll/save' callback='/admin/weekly-polls' showButton>
				<input type='hidden' name='id' value={id ? id : 0} />

				<Form.Group>
					<Text
						name='question'
						label='Question'
						value={question ? question : ''}
						required
						maxLength={constants.max.pollQuestion}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						name='description'
						label='Description'
						value={description ? description : ''}
						maxLength={constants.max.pollDescription}
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='date'
						name='startDate'
						label='Start Date'
						value={startDate ? dateUtils.formatYearMonthDay(startDate) : ''}
						required
						min={startDate ?
							dateUtils.formatYearMonthDay2(startDate) :
							dateUtils.formatCurrentDateYearMonthDay()}
						placeholder='MM/DD/YYYY'
					/>
				</Form.Group>

				<Form.Group>
					<Text
						type='number'
						name='duration'
						label='Duration (days)'
						value={duration ? duration : 7}
						min={1}
						max={constants.max.pollDuration}
						required
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='isMultipleChoice'
						label='Multiple Choice'
						value={isMultipleChoice ? isMultipleChoice : false}
					/>
				</Form.Group>

				<Form.Group>
					<Switch
						name='isEnabled'
						label='Enabled'
						value={isEnabled ? isEnabled : false}
					/>
				</Form.Group>

				<RequireClientJS fallback={
					<ErrorMessage identifier='javascript-required' />
				}
				>
					<InnerSection>
						<div className='EditPoll_links'>
							<Button
								clickHandler={addOption}
								label='Add Option'
								className='Form_button'
							/>
						</div>

						{curOptions.map((option: any, index: any) =>
							<div key={index} className='EditPoll_option'>
								<Form.Group>
									<Text
										name='options'
										label={`Option #${index + 1}`}
										value={option.description}
										maxLength={constants.max.pollOption}
									/>
								</Form.Group>

								<Button
									clickHandler={() => deleteOption(index)}
									label='Delete Option'
									className='Form_button'
								/>
							</div>,
						)}
					</InnerSection>
				</RequireClientJS>
			</Form>
		</div>
	);
};

type EditPollProps = {
	id?: PollType['id']
	question?: PollType['question']
	description?: PollType['description']
	startDate?: PollType['startDate']
	duration?: PollType['duration']
	isMultipleChoice?: PollType['isMultipleChoice']
	isEnabled?: PollType['isEnabled']
	options?: PollType['options']
};

export default EditPoll;
