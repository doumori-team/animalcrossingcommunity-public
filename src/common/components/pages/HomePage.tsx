import { Link } from 'react-router';

import { RequirePermission } from '@behavior';
import { ContentBox, ErrorMessage, Markup, PhotoGallery } from '@layout';
import Poll from '@/components/admin/Poll.tsx';
import { utils, constants, routerUtils } from '@utils';
import { UserContext } from '@contexts';
import { APIThisType, HomePollsType, CalendarType, AnnouncementsType, BirthdaysType } from '@types';

export const action = routerUtils.formAction;

const HomePage = ({ loaderData }: { loaderData: HomePageProps }) =>
{
	const { polls, calendars, announcements, birthdays, consolidateCalendars } = loaderData;

	const ConsolidatedCalendars = () =>
	{
		const events = calendars.flatMap((cal: CalendarType) =>
		{
			const [month, ..._] = cal.months;
			const relevant = month.categories.filter((cat: CalendarType['months']['categories']) => cat.identifier === 'events').flatMap((cat: CalendarType['months']['categories']) => cat.events);
			return relevant.map((ev: CalendarType['months']['categories']['events']) => ({ game: cal.game, month, event: ev, img: `${constants.AWS_URL}/images/games/${utils.getIconDirectoryFromGameID(cal.game.id)}/town_game_icon.png` }));
		}).sort((a, b) => new Date(a.event.sortDate).getTime() - new Date(b.event.sortDate).getTime()) ?? [];

		const creatures = calendars.filter((cal: CalendarType) =>
		{
			const [month, ..._] = cal.months;
			const catchables = month.categories.filter((cat: CalendarType['months']['categories']) => cat.identifier === 'creatures');
			return catchables && catchables.length > 0;
		}).map((cal: CalendarType) =>
		{
			const [month, ..._] = cal.months;
			const relevant = month.categories.filter((cat: CalendarType['months']['categories']) => cat.identifier === 'creatures').flatMap((cat: CalendarType['months']['categories']) => cat.events);
			return { game: cal.game, creatures: relevant, month };
		}) ?? [];

		const birthdays = (() =>
		{
			const seen = new Set<string>();
			return calendars.flatMap((cal: CalendarType) =>
			{
				const [month, ..._] = cal.months;
				return month.categories.filter((cat: CalendarType['months']['categories']) => cat.identifier === 'birthdays').flatMap((cat: CalendarType['months']['categories']) => cat.events);
			}).filter((event) =>
			{
				const key = `${event.name}-${event.timing}`;
				if (seen.has(key))
				{
					return false;
				}
				seen.add(key);
				return true;
			}).sort((a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime());
		})() ?? [];

		return <div className='HomePage_eventGameSection HomePage_eventGameSection_consolidated'>
			{events.length > 0 || creatures.length > 0 || birthdays.length > 0 ?
				<div className='HomePage_categorySections'>
					{
						events.length > 0 && <div className='HomePage_categorySection'>
							<div className='HomePage_categoryName'>
								Upcoming Seasons & Events
							</div>
							<div className='HomePage_eventSections'>
								{events.map((event, index) =>
								{
									return (
										<div key={index} className='HomePage_eventSection_consolidatedEventContainer'>
											<Link to={`/calendar?gameId=${encodeURIComponent(event.game.id)}&month=${encodeURIComponent(event.month.id)}&year=${encodeURIComponent(event.month.year)}`}>
												<img
													src={event.img}
													alt={event.game.name}
												/>
											</Link>
											<div className='HomePage_eventSection' key={index}>
												<div className='HomePage_eventName'>
													{event.event.name}
												</div>

												<div className='HomePage_timing'>
													{event.event.timing}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					}
					{
						creatures.length > 0 && <div className='HomePage_categorySection'>
							<div className='HomePage_categoryName'>
								Fish, Bugs & Sea Creatures
							</div>
							<div className='HomePage_eventSections'>
								{creatures.map((entry, index) =>
								{
									return (
										<div key={index}>
											<div className='HomePage_eventSections_consolidatedCreaturesHeader'>
												<Link to={`/calendar?gameId=${encodeURIComponent(entry.game.id)}&month=${encodeURIComponent(entry.month.id)}&year=${encodeURIComponent(entry.month.year)}`}>
													{entry.game.name}
												</Link>
											</div>
											{entry.creatures.map((creature: any, index: number) =>
											{
												return (
													<img
														src={creature.img}
														title={`${utils.capitalize(creature.name)}: ${creature.timing}`}
														alt={`${utils.capitalize(creature.name)}: ${creature.timing}`}
														key={`cr_${index}`}
													/>
												);
											})}
										</div>
									);
								})}
							</div>
						</div>
					}
					{
						birthdays.length > 0 && <div className='HomePage_categorySection'>
							<div className='HomePage_categoryName'>
								Villager Birthdays
							</div>
							<div className={'HomePage_eventSections grid'}>
								{birthdays.map((birthday, index) =>
								{
									return (
										<div className='HomePage_eventSection' key={index}>
											<div className='HomePage_eventName'>
												{birthday.name}
											</div>

											<div className='HomePage_timing'>
												{birthday.timing}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					}
				</div> : 'Nothing found.'}
		</div>;
	};

	const SeparateCalendars = () => <>
		{
			calendars.map((calendar: CalendarType) =>
			{
				const game: CalendarType['game'] = calendar.game;
				const [month, ..._] = calendar.months;
				return <div className='HomePage_eventGameSection' key={game.id}>
					<div className='HomePage_gameName'>
						<Link to={`/calendar?gameId=${encodeURIComponent(game.id)}&month=${encodeURIComponent(month.id)}&year=${encodeURIComponent(month.year)}`}>
							Upcoming In {game.name}
						</Link>
					</div>

					<div className='HomePage_categorySections'>
						{month.categories.map((category: CalendarType['months']['categories'], index: number) =>
							<div className='HomePage_categorySection' key={index}>
								<div className='HomePage_categoryName'>
									{category.name}
								</div>

								{category.events.length > 0 ?
									<div className={`HomePage_eventSections ${category.identifier === constants.calendarCategories.birthdays && 'grid'}`}>
										{category.events.map((event: CalendarType['months']['categories']['events'], index: number) =>
										{
											if (Object.prototype.hasOwnProperty.call(event, 'img'))
											{
												return (
													<img
														src={event.img}
														title={`${utils.capitalize(event.name)}: ${event.timing}`}
														alt={`${utils.capitalize(event.name)}: ${event.timing}`}
														key={index}
													/>
												);
											}

											return (
												<div className='HomePage_eventSection' key={index}>
													<div className='HomePage_eventName'>
														{event.name}
													</div>

													<div className='HomePage_timing'>
														{event.timing}
													</div>
												</div>
											);
										})}
									</div>
									:
									'Nothing found.'
								}
							</div>,
						)}
					</div>
				</div>;
			})
		}
	</>;

	return (
		<div className='HomePage'>
			<div className='HomePage_main'>
				<ContentBox>
					<div className='HomePage_intro'>
						<UserContext.Consumer>
							{user => user ?
								<>
									<p>Welcome to <strong>Animal Crossing Community</strong> (or just ACC), your one-stop fan site for everything Animal Crossing. <Link to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`}>Discuss the games with fellow members</Link>, <Link to='/trading-post'>trade in-game items</Link>, show off your town, create <Link to='/patterns'>patterns</Link> and <Link to='/town-tunes'>town tunes</Link>, and so much more. You can also find <Link to='/guides'>comprehensive guides</Link> covering all of the games. No matter what you do, be sure to keep an eye out for Bells that you can redeem for prizes in <Link to='/bell-shop'>the Bell Shop</Link>.</p>
									<p>Once again, welcome to the community. We hope you enjoy everything we have to offer and that you make some great friends here!</p>
								</>
								:
								<>
									<p>Welcome to <strong>Animal Crossing Community</strong> (or just ACC), your one-stop fan site for everything Animal Crossing. <Link to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`}>Discuss the games with fellow members</Link>, <Link to='/trading-post'>trade in-game items</Link>, show off your town, create <Link to='/patterns'>patterns</Link> and <Link to='/town-tunes'>town tunes</Link>, and so much more. You can also find <Link to='/guides'>comprehensive guides</Link> covering all of the games. No matter what you do, be sure to keep an eye out for Bells that you can redeem for prizes in the Bell Shop.</p>
									<p>Once again, welcome to the community. We hope you enjoy everything we have to offer and that you make some great friends here!</p>
								</>
							}
						</UserContext.Consumer>
						<div className='HomePage_buttons'>
							<Link to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`} reloadDocument>
								<div className='HomePage_button'>
									<img src={`${constants.AWS_URL}/images/layout/home_button1.png`} alt='Forums' />
								</div>
							</Link>
							<Link to='/trading-post' reloadDocument>
								<div className='HomePage_button'>
									<img src={`${constants.AWS_URL}/images/layout/trading.png`} alt='Trading' />
								</div>
							</Link>
							<Link to='/patterns' reloadDocument>
								<div className='HomePage_button'>
									<img src={`${constants.AWS_URL}/images/layout/patterns.png`} alt='Patterns' />
								</div>
							</Link>
							<Link to='/guides' reloadDocument>
								<div className='HomePage_button'>
									<img src={`${constants.AWS_URL}/images/layout/guides.png`} alt='Guides' />
								</div>
							</Link>
						</div>
					</div>
				</ContentBox>
			</div>
			<div className='HomePage_section'>
				<ContentBox>
					<div className='HomePage_announcementSection'>
						<h2>Announcements</h2>
						<div className='HomePage_announcements'>
							{announcements.length > 0 ?
								announcements.map((announcement, index) =>
									<div className='HomePage_announcement' key={index}>
										<div className='HomePage_created'>
											{announcement.created}
										</div>
										<div className='HomePage_title'>
											<Link to={`/forums/${encodeURIComponent(announcement.id)}`}>
												{announcement.title}
											</Link>
										</div>
										<div className='HomePage_content'>
											<Markup
												text={announcement.content.text}
												format={announcement.content.format}
											/>

											{announcement.files.length > 0 &&
												<PhotoGallery
													userId={announcement.userId}
													files={announcement.files}
													reportType={constants.userTicket.types.postImage}
												/>
											}
										</div>
									</div>,
								)
								:
								'No announcements found.'
							}
						</div>
					</div>
				</ContentBox>
				<div className='SideBar'>
					<ContentBox>
						<div className='HomePage_birthdaySection'>
							<div className='HomePage_title'><img
								src={`${constants.AWS_URL}/images/icons/birthday.png`}
								className='HomePage_icon'
								alt='Candle'
							/> Birthdays</div>
							<div className='HomePage_birthdays'>
								{birthdays.length > 0 ?
									birthdays.map((birthday, index) =>
										<UserContext.Consumer key={index}>
											{user => user ?
												<div className='HomePage_birthday' key={index}>
													<div className='HomePage_birthdayUser'>
														<Link to={`/profile/${encodeURIComponent(birthday.id)}`}>
															{birthday.username}
														</Link>
													</div>
													<div className='HomePage_birthdayActions'>
														<Link reloadDocument to={`/forums/${constants.boardIds.privateThreads}?addUsers=${birthday.username}#TextBox`}>
															<img
																src={`${constants.AWS_URL}/images/icons/pt.png`}
																className='HomePage_icon'
																alt='Private Thread'
															/>
														</Link>
													</div>
												</div>
												:
												<div className='HomePage_birthday' key={index}>
													<div className='HomePage_birthdayUser'>
														{birthday.username}
													</div>
												</div>
											}
										</UserContext.Consumer>,
									)
									:
									'No current birthdays.'
								}
							</div>
						</div>
					</ContentBox>
					<RequirePermission permission='view-polls' silent>
						<ContentBox>
							<div className='HomePage_pollSection'>
								<div className='HomePage_title'>Weekly Poll</div>
								{polls.currentPoll ?
									<Poll {...polls.currentPoll} />
									:
									<ErrorMessage identifier='poll-not-set-up' />
								}
								<hr className='HomePage_hr' />
								<div className='HomePage_title'>Last Week's Poll</div>
								{polls.previousPoll ?
									<Poll {...polls.previousPoll} />
									:
									<ErrorMessage identifier='poll-not-set-up' />
								}
							</div>
						</ContentBox>
					</RequirePermission>
					<RequirePermission permission='view-calendar' silent>
						<ContentBox>
							<div className='HomePage_events'>
								<div className='HomePage_title'>
									AC Events
								</div>
								{consolidateCalendars ? <ConsolidatedCalendars/> : <SeparateCalendars />}
							</div>
						</ContentBox>
					</RequirePermission>
				</div>
			</div>
		</div>
	);
};

async function loadData(this: APIThisType, _: any, { debug }: { debug?: string }): Promise<HomePageProps>
{
	const [polls, calendars, announcements, birthdays, settings] = await Promise.all([
		this.query('v1/home_polls'),
		this.query('v1/acgame/calendar_multi', { requester: 'homepage', debug: debug }),
		this.query('v1/node/announcements'),
		this.query('v1/birthdays'),
		this.userId ? this.query('v1/settings/account') : null,
	]);

	return {
		polls: polls,
		calendars: calendars,
		announcements: announcements,
		birthdays: birthdays,
		consolidateCalendars: settings ? settings.consolidateCalendars : false,
	};
}

export const loader = routerUtils.wrapLoader(loadData);

type HomePageProps = {
	polls: HomePollsType
	calendars: CalendarType[]
	announcements: AnnouncementsType[]
	birthdays: BirthdaysType[]
	consolidateCalendars: boolean
};

export default HomePage;
