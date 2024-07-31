import React from 'react';

import { dateUtils, constants } from '@utils';

const StatusIndicator = ({
	lastActiveTime,
	showDate = false
}: StatusIndicatorProps) =>
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
            // within 15 minutes; see v1/users/buddies.js
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
                <img src={`${constants.AWS_URL}/images/icons/buddy_online.png`} alt={date} />
            )}
            {idle && (
                <img src={`${constants.AWS_URL}/images/icons/buddy_idle.png`} alt={date} />
            )}
            {showDate && (
                <span> {date}</span>
            )}
        </>
    );
}

type StatusIndicatorProps = {
	lastActiveTime: string | null
	showDate?: boolean
};

export default StatusIndicator;
