import React from 'react';

import { TimeContext } from '@contexts';
import { dateUtils } from '@utils';

// Very simple component, just displays the current ACC time. Automatically ticks.
const Clock = () =>
{
	return (
		<TimeContext.Consumer>
			{time =>
				<span className='Clock'>
					{dateUtils.formatDateTime4(time)}
				</span>
			}
		</TimeContext.Consumer>
	);
};

export default Clock;
