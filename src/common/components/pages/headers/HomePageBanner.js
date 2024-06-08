import React from 'react';
import PropTypes from 'prop-types';

import { TimeContext } from '@contexts';
import { constants } from '@utils';

const HomePageBanner = ({bannerName}) =>
{
	return (
		<TimeContext.Consumer>
			{time => {
				const leftTime = bannerName === 'newyear' ? timeLeft(time) : {};

				return (
					<h1 className='HomePageBanner'>
						<img
							className='HomePageBanner_foreground'
							src={`${constants.AWS_URL}/images/banners/${bannerName}_foreground.png`}
							srcSet={`${constants.AWS_URL}/images/banners/${bannerName}_foreground.png 1x, ${constants.AWS_URL}/images/banners/${bannerName}_foreground@2x.png 2x`}
							alt='Welcome to Animal Crossing Community!'
						/>
						{bannerName === 'newyear' && (
							<span className='HomePageBanner_countDown'>
								{leftTime.days} : {leftTime.hours} : {leftTime.minutes} : {leftTime.seconds}
							</span>
						)}
					</h1>
				);
			}}
		</TimeContext.Consumer>
	);
}

function timeLeft(today)
{
	var deadline = 'January 1 ' + (today.getFullYear() + 1) + " 00:00:00";

	if (today.getMonth() == 0 && today.getDate() == 1)
	{
		deadline = 'January 1 ' + (today.getFullYear()) + " 00:00:00";
	};

	var t = Date.parse(deadline) - Date.parse(today);
	var seconds = Math.floor( (t/1000) % 60 );
	var minutes = Math.floor( (t/1000/60) % 60 );
	var hours = Math.floor((t/(1000*60*60)) % 24 );
	var days = Math.floor(t/(1000*60*60*24) );

	if (t <= 0)
	{
		seconds = 0;
		minutes = 0;
		hours = 0;
		days = 0;
	}

	return {
		'total': t,
		'days': ('0' + days).slice(-2),
		'hours': ('0' + hours).slice(-2),
		'minutes': ('0' + minutes).slice(-2),
		'seconds': ('0' + seconds).slice(-2)
	};
};

HomePageBanner.propTypes = {
	bannerName: PropTypes.string,
}

export default HomePageBanner;
