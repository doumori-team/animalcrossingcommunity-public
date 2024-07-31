import React, { useState, useEffect, useContext } from 'react';
import { useLoaderData, Outlet, useLocation, ScrollRestoration, useParams, useSearchParams } from 'react-router-dom';

import {
	PermissionsContext,
	TimeContext,
	UserContext,
	JackpotContext,
	TreasureContext
} from '@contexts';
import SiteContent from '@/components/layout/SiteContent.js';
import SiteHeader from '@/components/layout/SiteHeader.js';
import SiteFooter from '@/components/layout/SiteFooter.js';
import { ErrorMessage } from '@layout';
import HomePageBanner from '@/pages/headers/HomePageBanner.js';
import * as iso from 'common/iso.js';
import { getSeason } from 'common/calendar.js';
import { constants, dateUtils } from '@utils';
import {
	LocationType,
	APIThisType,
	StatusType,
	SeasonsType,
	TreasureType,
	LatestNotificationType,
	BuddiesType,
	SiteHeaderType
} from '@types';

const App = () =>
{
	const getZonedTimeNow = () : Date =>
	{
		return dateUtils.getCurrentDateTimezone();
	}

	const [time, setTime] = useState<Date>(getZonedTimeNow());
	const {status, jackpot, treasure, notifications, buddies, siteHeader} = useLoaderData() as AppProps;
	const location = useLocation() as LocationType;
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();

	const userContext = useContext(UserContext);

	const updateSession = () =>
	{
		if (userContext)
		{
			let query:any = {};

			for (const [key, value] of searchParams.entries())
			{
				query[key] = value;
			}

			(iso as any).query(null, 'v1/session/update', {
				url: location.pathname,
				params: params,
				query: query,
			})
			.catch((error:any) =>
			{
				console.error(error);
			});
		}
	}

	const updateFavicon = () : void =>
	{
		let icon = `${constants.AWS_URL}/images/layout/favicon/`;

		if (constants.LIVE_SITE || status.season.debug)
		{
			icon += `gyroid-${status.season.season}.ico`;
		}
		else
		{
			icon += 'gyroid-test.ico';
		}

		(document.getElementById('acc-favicon') as HTMLLinkElement).href = icon;
	}

	const updateTitle = (): void =>
	{
		(iso as any).query(null, 'v1/title', {
			pathname: location.pathname,
		})
		.then((data:string) =>
		{
			document.title = data;
		})
		.catch((error:any) =>
		{
			console.error(error);
		});
	}

	useEffect(() => {
		const intervalId = setInterval(() =>
		{
			setTime(getZonedTimeNow());
		}, 1000);

		return () => clearInterval(intervalId);
	}, []);

	useEffect(() => {
		updateSession();
		updateFavicon();
		updateTitle();
	}, [location]);

	return (
		(status.banLength) ? (
			<div className='App_banned'>
				<ErrorMessage
					message='You are currently banned from Animal Crossing Community. An email has been sent to your registered email address containing more details.'
				/>
			</div>
		) : (
			<UserContext.Provider value={status.user}>
				<PermissionsContext.Provider value={status.permissions}>
					<TimeContext.Provider value={time}>
						<JackpotContext.Provider value={jackpot}>
							<TreasureContext.Provider value={treasure}>
								<div {...getSeasonsStyle(status.season)}>
									<SiteHeader
										latestNotification={notifications.notification}
										notificationCount={notifications.totalCount}
										buddies={buddies}
										options={siteHeader}
									/>
									{location.pathname === '/' && <HomePageBanner bannerName={status.season.bannerName} />}
									<SiteContent>
										<Outlet />
									</SiteContent>
									<SiteFooter />
									<ScrollRestoration />
								</div>
							</TreasureContext.Provider>
						</JackpotContext.Provider>
					</TimeContext.Provider>
				</PermissionsContext.Provider>
			</UserContext.Provider>
		)
	);
}

function getSeasonsStyle({bg_colors, ui_colors, theme, bannerName, season, event}: SeasonsType) : {style: any, className: string}
{
	let style:any = {};
	let className = `App App-${event}`;

	style['--seasonal-color'] = ui_colors.default;
	style['--seasonal-color-dark'] = ui_colors.dark;
	style['--seasonal-color-light'] = ui_colors.light;
	style['--seasonal-color-lighter'] = ui_colors.lighter;
	style['--seasonal-color-accent'] = ui_colors.light;
	style['--seasonal-color-header'] = ui_colors.header;
	style['--seasonal-grass'] = `url('${getGrassBackgroundSvg(bg_colors)}')`;
	style['--banner-background'] = `url('${constants.AWS_URL}/images/banners/${bannerName}_background.png')`;
	style['--banner-background-2x'] = `url('${constants.AWS_URL}/images/banners/${bannerName}_background@2x.png')`;

	if (theme !== 'default')
	{
		className += ` App-${theme}`;
	}

	if (season === 'summer')
	{
		style['--seasonal-color-buttons'] = ui_colors.light;
	}
	else
	{
		style['--seasonal-color-buttons'] = ui_colors.lighter;
	}

	return {style, className};
}

/* Generates an SVG file for the site's grassy background, filling in the seasonal colours.
 * parameters: colors - should be an array of four strings, each one being a CSS colour
 */
function getGrassBackgroundSvg(colors:SeasonsType['bg_colors']) : string
{
	const svg = `
	<?xml version="1.0" encoding="UTF-8" standalone="no"?>
	<svg xmlns="http://www.w3.org/2000/svg" height="128" width="128" viewBox="0 0 16.933332 16.933332" style="background-color: ${colors[0]}">
		<defs>
			<g id="foreground" style="opacity: 0.625" transform="translate(-86.948555, -71.24321)">
				<g style="fill: ${colors[1]}">
					<path d="m 90.915084,74.348389 -2.007997,3.106492 3.212796,0.413411 z" />
					<path d="m 91.517485,73.994038 2.01981,2.090679 0.850445,-2.728515 z" />
					<path d="m 93.210247,89.009225 1.403164,-2.672696 1.637028,2.806332 z" />
					<path d="m 98.238256,90.830172 -1.252826,-3.223937 3.70836,0.7684 z" />
					<path d="m 101.64594,73.562664 1.85418,-1.753954 0.93545,2.639284 z" />
					<path d="m 93.577742,76.736492 2.622582,2.505652 1.353053,-3.892114 z" />
					<path d="m 104.56472,78.742364 0.81501,2.964749 -2.92932,-0.472469 z" />
					<path d="m 89.804779,81.825231 1.523716,2.704894 1.405599,-2.598587 z" />
					<path d="m 89.73391,84.459253 -1.748142,2.35054 3.08287,0.460658 z" />
					<path d="m 98.864398,84.471064 -0.803201,2.681269 2.657643,-0.590587 z" />
					<path d="m 96.513858,81.423633 0.614211,3.189174 2.031622,-2.031622 z" />
					<path d="m 102.78184,75.433551 0.0501,3.173826 -2.856443,-1.386459 z" />
				</g>
				<g style="fill: ${colors[2]}">
					<path d="m 87.32431,71.501756 1.878071,3.732517 2.267857,-3.697082 z" />
					<path d="m 94.780456,72.794267 0.751694,2.23838 1.486686,-2.088042 z" />
					<path d="m 99.825168,73.295395 -1.18601,2.639288 3.073602,-0.501132 z" />
					<path d="m 103.12367,82.356761 1.02763,3.838821 2.4214,-2.622209 z" />
					<path d="m 94.671223,81.61262 -2.078868,2.716705 3.342727,0.614211 z" />
					<path d="m 95.427174,86.467253 2.019811,0.720516 -0.248047,-2.008 z" />
					<path d="m 102.20712,85.026218 -0.2008,-3.555338 -2.846629,2.126115 z" />
					<path d="m 92.946706,78.269893 -0.661459,3.047433 2.952941,-1.204798 z" />
					<path d="m 100.87754,78.590673 -0.10023,2.422131 2.12146,-0.968854 z" />
				</g>
				<g style="fill: ${colors[3]}">
					<path d="m 104.55301,77.490316 1.25204,-1.842632 -2.17336,-0.129929 z" />
					<path d="m 89.73391,78.435257 -0.862259,2.811198 2.716705,-0.507905 z" />
					<path d="m 91.600167,85.675863 0.283483,2.055246 1.736328,-1.311105 z" />
					<path d="m 101.36849,86.053842 0.0945,2.728515 2.46866,-1.665459 z" />
					<path d="m 96.360304,80.018034 2.941127,-2.338728 0.803199,3.578963 z" />
				</g>
			</g>
		</defs>
		<use href="#foreground" x="0" y="0" />
		<use href="#foreground" x="-16.933332" y="0" />
		<use href="#foreground" x="0" y="-16.933332" />
		<use href="#foreground" x="-16.933332" y="-16.933332" />
	</svg>`;

	return `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace('\n','').replace('\t',''))}`;
}

export async function loadData(this: APIThisType, _:any, {debug}: {debug?: string}) : Promise<AppProps>
{
	const [status, jackpot, treasure, notifications, buddies, siteHeader] = await Promise.all([
		this.query('v1/status'),
		this.query('v1/treasure/jackpot'),
		this.query('v1/treasure'),
		this.query('v1/notification/latest'),
		this.query('v1/users/buddies', {online: true}),
		this.query('v1/site_header'),
	]);

	return {
		status: {
			...status,
			season: getSeason(constants.LIVE_SITE ? null : debug, status.southernHemisphere),
		},
		jackpot: Number(jackpot).toLocaleString(),
		treasure,
		notifications,
		buddies,
		siteHeader,
	};
}

type AppProps = {
	status: StatusType & {
		season: SeasonsType
	}
	jackpot: string
	treasure: TreasureType|null
	notifications: LatestNotificationType
	buddies: BuddiesType
	siteHeader: SiteHeaderType[]
}

export default App;
