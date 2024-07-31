import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar.tsx';
import { Button } from '@form';
import StatusIndicator from '@/components/nodes/StatusIndicator.tsx';
import { BuddiesType, ClickHandlerButtonType } from '@types';

const BuddiesMenu = forwardRef<HTMLElement, BuddiesMenuProps>(({dynamic, closeFunc, buddies}, ref) =>
{
	let className = 'BuddiesMenu';

	if (dynamic)
	{
		className += ' BuddiesMenu-dynamic';
	}

	return (
		<nav className={className} ref={ref}>
			{dynamic &&
				<Navbar>
					<Navbar.Item>
						<Button
							clickHandler={closeFunc}
							label='Close'
						/>
					</Navbar.Item>
				</Navbar>
			}
			<ul className='BuddiesMenu_content'>
				{buddies && buddies.buddies.concat(buddies.staff).length > 0 ? (
					buddies.buddies.concat(buddies.staff).map(buddy =>
						<li key={buddy.id} className='BuddiesMenu_link'>
							<div className='BuddiesMenu_name'>
								<Link to={`/profile/${encodeURIComponent(buddy.id)}`}>
									{buddy.username}
								</Link>
							</div>

							<div className='BuddiesMenu_lastActive'>
								<StatusIndicator
									lastActiveTime={buddy.lastActiveTime}
									showDate={true}
								/>
							</div>
						</li>
					)
				) : (
					<li className='BuddiesMenu_link'>
						No online buddies.
					</li>
				)}
			</ul>
		</nav>
	);
});

type BuddiesMenuProps = {
	dynamic: boolean
	closeFunc: ClickHandlerButtonType
	buddies: BuddiesType
};

export default BuddiesMenu;
