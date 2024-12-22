import React, { useContext } from 'react';

import { PollType } from '@types';
import { Form, Checkbox } from '@form';
import { Markup } from '@layout';
import { dateUtils } from '@utils';
import { PermissionsContext } from '@contexts';

const Poll = ({
	id,
	question,
	description,
	startDate,
	endDate,
	isMultipleChoice,
	isEnabled,
	userHasVoted,
	options,
}: PollProps) =>
{
	if (!isEnabled)
	{
		return '';
	}

	const permissions = useContext(PermissionsContext);

	// Determine whether this poll is within
	// the allotted time frame to accept votes.
	const allowVotes = !!(
		dateUtils.isBeforeCurrentDateTimezone(startDate)
		&& dateUtils.isAfterCurrentDateTimezone(endDate)
	);

	const totalVotes = options.reduce((acc, cur) =>
	{
		return acc + cur.votes;
	}, 0);

	return (
		<div className='Poll'>
			<div className='PollQuestion'>
				{question}
			</div>

			{description &&
				<Markup
					text={description}
					format={'markdown'}
				/>
			}

			{!userHasVoted && allowVotes && permissions.includes('vote-poll') ?
				<Form action='v1/poll/vote' showButton buttonText='Vote!'>
					<input type='hidden' name='pollId' value={id} />

					<div className='PollOptions'>
						{options.map(option =>
							<div key={option.sequence} className='PollOption'>
								<Checkbox
									type={isMultipleChoice ? 'checkbox' : 'radio'}
									name='choices'
									value={option.sequence}
									disabled={dateUtils.isAfterCurrentDateTimezone(startDate)}
									label={option.description}
									hideLabel
								/>
								<span className='PollOptionDescription'>
									{option.description}
								</span>
							</div>,
						)}
					</div>
				</Form>
				:
				<div className='PollOptions'>
					{options.map(option =>
					{
						const proportion = totalVotes > 0 ? option.votes / totalVotes : 0;
						const amount = option.votes + ' vote' + (option.votes === 1 ? '' : 's');

						return (
							<div key={option.sequence} className='PollOption'>
								<div className='PollOptionDescription Voted'>
									{option.description}
								</div>
								<div className='PollOptionVotes'>
									{(proportion * 100).toFixed(1)}% ({amount})
								</div>
								<meter
									className='PollOptionResult_meter'
									value={proportion}
									title={amount}
								/>
							</div>
						);
					})}
				</div>
			}
		</div>
	);
};

type PollProps = PollType;

export default Poll;
