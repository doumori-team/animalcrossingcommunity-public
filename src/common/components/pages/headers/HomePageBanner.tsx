import { TimeContext } from '@contexts';
import { constants, dateUtils } from '@utils';

const HomePageBanner = ({
	bannerName,
}: HomePageBannerProps) =>
{
	return (
		<TimeContext.Consumer>
			{time =>
			{
				const leftTime = bannerName === 'newyear' && time ? timeLeft(time) : null;

				return (
					<h1 className='HomePageBanner'>
						<img
							className='HomePageBanner_foreground'
							src={
								constants.allImages[
      								`banners/${bannerName}_foreground.png`
								]
							}
							srcSet={`
								${constants.allImages[`banners/${bannerName}_foreground.png`]} 1x,
								${constants.allImages[`banners/${bannerName}_foreground@2x.png`]} 2x
							`}
							alt='Welcome to Animal Crossing Community!'
						/>
						{leftTime && bannerName === 'newyear' &&
							<span className='HomePageBanner_countDown'>
								{leftTime.days} : {leftTime.hours} : {leftTime.minutes} : {leftTime.seconds}
							</span>
						}
					</h1>
				);
			}}
		</TimeContext.Consumer>
	);
};

function timeLeft(today: Date): { total: number, days: string, hours: string, minutes: string, seconds: string }
{
	let deadline = 'January 1 ' + (today.getFullYear() + 1) + ' 00:00:00';

	if (today.getMonth() === 0 && today.getDate() === 1)
	{
		deadline = 'January 1 ' + today.getFullYear() + ' 00:00:00';
	};

	let t = dateUtils.dateParse(deadline) - today.getTime();
	let seconds = Math.floor(t / 1000 % 60);
	let minutes = Math.floor(t / 1000 / 60 % 60);
	let hours = Math.floor(t / (1000 * 60 * 60) % 24);
	let days = Math.floor(t / (1000 * 60 * 60 * 24));

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
		'seconds': ('0' + seconds).slice(-2),
	};
}

type HomePageBannerProps = {
	bannerName: string
};

export default HomePageBanner;
