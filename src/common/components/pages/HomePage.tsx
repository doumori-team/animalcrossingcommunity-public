import React from 'react';
import { Link, useLoaderData } from 'react-router-dom';

import { RequirePermission } from '@behavior';
import { ContentBox, ErrorMessage, Markup, PhotoGallery } from '@layout';
import Poll from '@/components/admin/Poll.tsx';
import { utils, constants } from '@utils';
import { UserContext } from '@contexts';
import { APIThisType, HomePollsType, CalendarType, AnnouncementsType, BirthdaysType } from '@types';

const HomePage = () =>
{
	const { polls, game, month, announcements, birthdays } = useLoaderData() as HomePageProps;

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
								<div className='HomePage_eventGameSection'>
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
								</div>
							</div>
						</ContentBox>
					</RequirePermission>
				</div>
			</div>
		</div>
	);
};

export async function loadData(this: APIThisType, _: any, { debug }: { debug?: string }): Promise<HomePageProps>
{
	const [polls, returnValue, announcements, birthdays] = await Promise.all([
		this.query('v1/home_polls'),
		this.query('v1/acgame/calendar', { requester: 'homepage', debug: debug }),
		this.query('v1/node/announcements'),
		this.query('v1/birthdays'),
	]);

	return {
		polls: polls,
		game: returnValue.game,
		month: returnValue.months.shift(),
		announcements: announcements,
		birthdays: birthdays,
	};
}

type HomePageProps = {
	polls: HomePollsType
	game: CalendarType['game']
	month: CalendarType['months']
	announcements: AnnouncementsType[]
	birthdays: BirthdaysType[]
};

export default HomePage;
