import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import Clock from '@/components/layout/Clock.js';
import LoginButton from '@/components/layout/LoginButton.js';
import LogoutButton from '@/components/layout/LogoutButton.js';
import Navbar from '@/components/layout/Navbar.js';
import NavbarMenuButton from '@/components/layout/NavbarMenuButton.js';
import { UserContext } from '@contexts';
import * as iso from 'common/iso.js';
import { notificationShape } from '@propTypes';
import { constants } from '@utils';

// The bit of the page that comes above the content

const SiteHeader = ({latestNotification, notificationCount}) =>
{
	const [notiCount, setNotiCount] = useState(notificationCount);
	const [latNoti, setLatNoti] = useState(latestNotification);

	const userContext = useContext(UserContext);

	useEffect(() => {
		if (userContext)
		{
			const intervalId = setInterval(() =>
			{
				getLatestNotification();
			}, 1000*10);

			return () => clearInterval(intervalId);
		}
	}, []);

	const getLatestNotification = () =>
	{
		iso.query(null, 'v1/notification/latest', null)
			.then(data =>
			{
				setNotiCount(data.totalCount);
				setLatNoti(data.notification);
			})
			.catch(error =>
			{
				// records error on server side
			})
	}

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
							src='/images/layout/acc-logo-narrow.png'
							alt='ACC'
							height='100%'
						/>
					</Link>
				</Navbar.Item>
				<Navbar.Item extra><Link to='/faq#acc-time'><Clock /></Link></Navbar.Item>
				<Navbar.Item extra><Link to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`}>Forums</Link></Navbar.Item>
				<Navbar.Item extra permission='use-trading-post'><Link to='/trading-post'>Trading Post</Link></Navbar.Item>
				<Navbar.Item extra permission='view-tunes'><Link to='/town-tunes'>Town Tunes</Link></Navbar.Item>
				<Navbar.Item extra permission='view-patterns'><Link to='/patterns'>Patterns</Link></Navbar.Item>
				<Navbar.Item extra permission='use-friend-codes'><Link to='/friend-codes'>Friend Codes</Link></Navbar.Item>
				<Navbar.Item extra permission='purchase-bell-shop'><Link to='/bell-shop'>Bell Shop</Link></Navbar.Item>
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
									src='/images/layout/bulletin-bird-lit.png'
									alt='Notifications'
								/>
								{notiCount > 0 && (
									<span className='SiteHeader_notificationCount'>
										{notiCount > 99 ? `99+` : notiCount}
									</span>
								)}
							</Link>
							{latNoti != null && (
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
							)}
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
}

SiteHeader.propTypes = {
	latestNotification: notificationShape,
	notificationCount: PropTypes.number,
};

export default SiteHeader;
