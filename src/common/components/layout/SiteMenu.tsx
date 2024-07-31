import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';

import Clock from '@/components/layout/Clock.tsx';
import LoginButton from '@/components/layout/LoginButton.tsx';
import LogoutButton from '@/components/layout/LogoutButton.tsx';
import Navbar from '@/components/layout/Navbar.tsx';
import { RequireUser, RequirePermission, RequireTestSite } from '@behavior';
import { Form, Text, Button } from '@form';
import { UserContext, JackpotContext } from '@contexts';
import { constants } from '@utils';
import { ClickHandlerButtonType } from '@types';

/* Big dropdown that appears when clicking the menu button in the top left
 * corner. Add the "dynamic" prop to enable the positioning and animation
 * features seen there; otherwise it is just a simple flat list.
 *
 * If the "dynamic" prop is present, you should also provide a "closeFunc" prop
 * that is a function the menu can call to close itself.
 */
const SiteMenu = forwardRef<HTMLElement, SiteMenuProps>(({dynamic, closeFunc}, ref) =>
{
    let className = 'SiteMenu';
    if (dynamic)
    {
        className += ' SiteMenu-dynamic';
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
                    <Navbar.Spacer />
                    <Navbar.Item>
                        <Link to='/faq#acc-time'>
                            <Clock />
                        </Link>
                    </Navbar.Item>
                </Navbar>
            }
            <ul className='SiteMenu_content'>
                <li className='SiteMenu_link'>
                    <UserContext.Consumer>
                        {user => user && (
                            <>
                            <Link to={`/profile/${encodeURIComponent(user.id)}`}>
                                {user.username}
                            </Link> - <Link to='/settings'>Settings</Link><br/>
                            <Link to='/faq#treasure'>
                                Bells: {user.bells} ({user.allBells})
                            </Link><br/>
                            <Link to='/faq#treasure'>
                                Missed Bells: {user.missedBells}
                            </Link><br/>
                            </>
                        )}
                    </UserContext.Consumer>
                    <JackpotContext.Consumer>
                        {jackpot => jackpot && (
                            <Link to='/faq#treasure'>
                                Jackpot: {jackpot}
                            </Link>
                        )}
                    </JackpotContext.Consumer>
                </li>
                <SiteMenuLink to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`}>
                    Forums
                </SiteMenuLink>
                <RequireUser silent>
                    <SiteMenuLink to={`/forums/${constants.boardIds.privateThreads}`}>
                        Private Threads
                    </SiteMenuLink>
                </RequireUser>
                <RequirePermission permission='use-trading-post' silent>
                    <SiteMenuLink to='/trading-post'>
                        Trading Post
                    </SiteMenuLink>
                </RequirePermission>
                <RequirePermission permission='view-tunes' silent>
                    <SiteMenuLink to='/town-tunes'>
                        Town Tunes
                    </SiteMenuLink>
                </RequirePermission>
                <RequirePermission permission='view-patterns' silent>
                    <SiteMenuLink to='/patterns'>
                        Patterns
                    </SiteMenuLink>
                </RequirePermission>
                <RequirePermission permission='use-friend-codes' silent>
                    <SiteMenuLink to='/friend-codes'>
                        Friend Codes
                    </SiteMenuLink>
                </RequirePermission>
                <RequirePermission permission='purchase-bell-shop' silent>
                    <SiteMenuLink to='/bell-shop'>
                        Bell Shop
                    </SiteMenuLink>
                </RequirePermission>
                <RequirePermission permission='view-guides' silent>
                    <SiteMenuLink to='/guides'>
                        Guides
                    </SiteMenuLink>
                </RequirePermission>
                <RequireUser silent>
                    <RequirePermission permission='view-shops' silent>
                        <SiteMenuLink to='/shops'>
                            Shops & Services
                        </SiteMenuLink>
                    </RequirePermission>
                    <RequirePermission permission='use-buddy-system' silent>
                        <SiteMenuLink to='/buddies'>
                            Buddies
                        </SiteMenuLink>
                    </RequirePermission>
                    <SiteMenuLink to='/followed/thread'>
                        Followed Threads
                    </SiteMenuLink>
                    <SiteMenuLink to='/followed/board'>
                        Followed Boards
                    </SiteMenuLink>
                </RequireUser>
                <UserContext.Consumer>
                    {user => user && (
                        <>
                        <SiteMenuLink to={`/threads/${encodeURIComponent(user.id)}`}>
                            Threads
                        </SiteMenuLink>
                        <RequirePermission permission='scout-pages' silent>
                            <SiteMenuLink to='/scout-hub'>
                                Scout Hub
                            </SiteMenuLink>
                        </RequirePermission>
                        {user.adoptionThreadId && (
                            <SiteMenuLink to={`/scout-hub/adoption/${user.adoptionThreadId}`}>
                                Adoption Thread
                            </SiteMenuLink>
                        )}
                        {user.adopteeBuddyThreadId && (
                            <SiteMenuLink to={`/scout-hub/adoption/${user.adopteeBuddyThreadId}`}>
                                Adoptee Buddy Thread
                            </SiteMenuLink>
                        )}
                        </>
                    )}
                </UserContext.Consumer>
                <RequireUser silent>
                    <RequireTestSite>
                        <SiteMenuLink to='/automation'>
                            Automation
                        </SiteMenuLink>
                    </RequireTestSite>
                    <RequirePermission permission='admin-pages' silent>
                        <SiteMenuLink to='/admin'>
                            Admin
                        </SiteMenuLink>
                    </RequirePermission>
                    <RequirePermission permission='modmin-pages' silent>
                        <SiteMenuLink to='/modmin'>
                            Modmin
                        </SiteMenuLink>
                    </RequirePermission>
                    <SiteMenuLink to='/top-bells'>
                        Top Bells
                    </SiteMenuLink>
                    <SiteMenuLink to='/tickets'>
                        Tickets
                    </SiteMenuLink>
                    <li className='SiteMenu_link'>
                        <Form
                            action='v1/user_lite'
                            callback='/profile/:id'
                            className='UsernameSearch'
                            showButton
                            buttonText='Go'
                        >
                            <div className='UsernameSearch_option'>
                                <Text
                                    label='Search for user'
                                    name='username'
                                    placeholder='e.g. hoggle'
                                    maxLength={constants.max.searchUsername}
                                    required
                                />
                            </div>
                        </Form>
                    </li>
                </RequireUser>
                <UserContext.Consumer>
                    {user => user ? <li className='SiteMenu_link'><LogoutButton /></li> : (
                        <>
                        <li className='SiteMenu_link'><LoginButton /></li>
                        <SiteMenuLink to='/sign-up'>
                            Sign Up
                        </SiteMenuLink>
                        </>
                    )}
                </UserContext.Consumer>
            </ul>
        </nav>
    );
});

type SiteMenuProps = {
	dynamic?: boolean
	closeFunc?: ClickHandlerButtonType
};

const SiteMenuLink = ({
	to,
	children
}: SiteMenuLinkProps) =>
{
    return (
        <li>
            <Link to={to} className='SiteMenu_link'>
                {children}
            </Link>
        </li>
    );
}

type SiteMenuLinkProps = {
	to: string
	children: any
};

export default SiteMenu;
