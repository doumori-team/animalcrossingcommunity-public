import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';

import Clock from '@/components/layout/Clock.tsx';
import LoginButton from '@/components/layout/LoginButton.tsx';
import LogoutButton from '@/components/layout/LogoutButton.tsx';
import Navbar from '@/components/layout/Navbar.tsx';
import NavbarMenuButton from '@/components/layout/NavbarMenuButton.tsx';
import { UserContext } from '@contexts';
import * as iso from 'common/iso.js';
import { constants } from '@utils';
import { LatestNotificationType, BuddiesType, SiteHeaderType } from '@types';

const SiteHeader = ({
	latestNotification,
	notificationCount,
	buddies,
	options = [],
}: SiteHeaderProps) =>
{
	const [notiCount, setNotiCount] = useState<number>(notificationCount);
	const [latNoti, setLatNoti] = useState<LatestNotificationType['notification'] | null>(latestNotification);

	const userContext = useContext(UserContext);

	useEffect(() =>
	{
		if (userContext)
		{
			const intervalId = setInterval(() =>
			{
				(iso as any).query(null, 'v1/notification/latest', null)
                    .then((data: LatestNotificationType) =>
                    {
                    	setNotiCount(data.totalCount);
                    	setLatNoti(data.notification);
                    })
                    .catch((_: any) =>
                    {
                    	// records error on server side
                    });
			}, 1000 * 10);

			return () => clearInterval(intervalId);
		}
	}, []);

	return (
		<header className='SiteHeader'>
			<Navbar>
				<Navbar.Item icon>
					<NavbarMenuButton fallbackLink='/menu'>
						<svg className='MenuIcon' viewBox='0 0 16 16' height='16px' width='16px' aria-label='Menu'>
							<rect x='0' y='0' width='16' height='4' rx='1' ry='1' />
							<rect x='0' y='6' width='16' height='4' rx='1' ry='1' />
							<rect x='0' y='12' width='16' height='4' rx='1' ry='1' />
							Menu
						</svg>
					</NavbarMenuButton>
				</Navbar.Item>
				<Navbar.Item>
					<Link to='/' reloadDocument>
						<img
							src={`${constants.AWS_URL}/images/layout/acc-logo-narrow.png`}
							alt='ACC'
							height='100%'
						/>
					</Link>
				</Navbar.Item>
				<Navbar.Item extra><Link to='/faq#acc-time'><Clock /></Link></Navbar.Item>

				{options.length > 0 ?
					<>
						{options.map(option =>
							option.permission ?
								<Navbar.Item extra permission={option.permission} key={option.name}><Link to={option.url}>{option.name}</Link></Navbar.Item>
								:
								option.url === '/threads/' ?
									<Navbar.Item extra><Link to={`${option.url}${userContext?.id}`}>{option.name}</Link></Navbar.Item>
									:
									<Navbar.Item extra><Link to={option.url}>{option.name}</Link></Navbar.Item>

							,
						)}
					</>
					:
					<>
						<Navbar.Item extra><Link to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`}>Forums</Link></Navbar.Item>
						<Navbar.Item extra permission='use-trading-post'><Link to='/trading-post'>Trading Post</Link></Navbar.Item>
						<Navbar.Item extra permission='view-tunes'><Link to='/town-tunes'>Town Tunes</Link></Navbar.Item>
						<Navbar.Item extra permission='view-patterns'><Link to='/patterns'>Patterns</Link></Navbar.Item>
						<Navbar.Item extra permission='use-friend-codes'><Link to='/friend-codes'>Friend Codes</Link></Navbar.Item>
						<Navbar.Item extra permission='purchase-bell-shop'><Link to='/bell-shop'>Bell Shop</Link></Navbar.Item>
					</>
				}

				<Navbar.Spacer />
				<UserContext.Consumer>
					{user => user ?
						<>
							<div className='NavbarItem-icon SiteHeader_notifications'>
								<Link
									to='/notifications'
									title='Notifications'
									className='SiteHeader_notificationsLink'
								>
									<img
										src={`${constants.AWS_URL}/images/layout/bulletin-bird-lit.png`}
										alt='Notifications'
									/>
									{notiCount > 0 &&
										<span className='SiteHeader_notificationCount'>
											{notiCount > 99 ? `99+` : notiCount}
										</span>
									}
								</Link>
								{!!latNoti &&
									<Link
										to={latNoti.url}
										className='SiteHeader_notification'
										role='alert'
										aria-live='polite'
										reloadDocument={latNoti.anchor ? true : false}
									>
										<div className='SiteHeader_notificationArrow' />
										<div className='SiteHeader_notificationBody'>
											{latNoti.description}
										</div>
									</Link>
								}
							</div>
							<div className='NavbarItem NavbarItem-icon SiteHeader_buddies'>
								<NavbarMenuButton fallbackLink='/buddies' buddies={buddies}>
									<img
										src={`${constants.AWS_URL}/images/layout/buddies.png`}
										alt='Buddies'
										className={buddies && buddies.staff.concat(buddies.buddies).length > 0 ? 'buddiesCountImg' : ''}
									/>
									{buddies && buddies.staff.concat(buddies.buddies).length > 0 &&
										<span className='SiteHeader_buddiesCount'>
											{buddies.staff.concat(buddies.buddies).length > 99 ? `99+` : buddies.staff.concat(buddies.buddies).length}
										</span>
									}
								</NavbarMenuButton>
							</div>
							<Navbar.Item extra username>
								<Link to={`/profile/${user.id}`}>{user.username}</Link>
							</Navbar.Item>
							<Navbar.Item><LogoutButton /></Navbar.Item>
						</>
						: <>
							<Navbar.Item><LoginButton /></Navbar.Item>
							<Navbar.Item>
								<Link to='/sign-up' reloadDocument>Sign Up</Link>
							</Navbar.Item>
						</>
					}
				</UserContext.Consumer>
			</Navbar>
		</header>
	);
};

type SiteHeaderProps = {
	latestNotification: LatestNotificationType['notification']
	notificationCount: LatestNotificationType['totalCount']
	buddies: BuddiesType
	options: SiteHeaderType[]
};

export default SiteHeader;
