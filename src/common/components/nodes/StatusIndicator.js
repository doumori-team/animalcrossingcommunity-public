import React from 'react';
import PropTypes from 'prop-types';

import { dateUtils } from '@utils';

const StatusIndicator = ({lastActiveTime, showDate}) =>
{
	let date = null, active = false, idle = false;

	// never logged in
	if (lastActiveTime === null)
	{
		date = 'Never logged in';
	}
	else
	{
		// same day
		if (dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'day'))
		{
			date = dateUtils.formatHoursMinutes(lastActiveTime);

			// within 5 minutes
			if (dateUtils.isAfterTimezone(lastActiveTime, dateUtils.subtractFromCurrentDateTimezone(5, 'minutes')))
			{
				active = true;
			}
			// within 15 minutes
			else if (dateUtils.isAfterTimezone(lastActiveTime, dateUtils.subtractFromCurrentDateTimezone(15, 'minutes')))
			{
				idle = true;
			}
		}
		// same year
		else if (dateUtils.isSameCurrentDateTimezone(lastActiveTime, 'year'))
		{
			date = dateUtils.formatMonthDayHoursMinutes(lastActiveTime);
		}
		else
		{
			date = dateUtils.formatMonthDayYearHoursMinutes(lastActiveTime);
		}
	}

	return (
		<>
			{active && (
				<img src={`${process.env.AWS_URL}/images/icons/buddy_online.png`} alt={lastActiveTime} />
			)}
			{idle && (
				<img src={`${process.env.AWS_URL}/images/icons/buddy_idle.png`} alt={lastActiveTime} />
			)}
			{showDate && (
				<span> {date}</span>
			)}
		</>
	);
}

StatusIndicator.propTypes = {
	lastActiveTime: PropTypes.any,
	showDate: PropTypes.bool,
};

export default StatusIndicator;
