import { FC, Ref, useState } from 'react';
import { Link } from 'react-router';

import Clock from '@/components/layout/Clock.tsx';
import LoginButton from '@/components/layout/LoginButton.tsx';
import LogoutButton from '@/components/layout/LogoutButton.tsx';
import Navbar from '@/components/layout/Navbar.tsx';
import { RequireUser, RequirePermission, RequireTestSite, RequireClientJS } from '@behavior';
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
const SiteMenu = ({ dynamic, closeFunc, ref }: SiteMenuProps) =>
{
	let className = 'SiteMenu';
	if (dynamic)
	{
		className += ' SiteMenu-dynamic';
	}

	const [myACCOpen, setMyACCOpen] = useState<boolean>(true);
	const [communityOpen, setCommunityOpen] = useState<boolean>(true);
	const [staffOpen, setStaffOpen] = useState<boolean>(true);

	const ArrowToggle: FC<{ open?: boolean }> = ({ open }) =>
		<div className={`Menu_arrow_toggle${open ? ' Menu_arrow_toggle_open' : ''}`} />;

	const MyACC: FC<{ indent?: boolean }> = ({ indent }) => <>
		<SiteMenuLink to={`/forums/${constants.boardIds.privateThreads}`} indent={indent} label='Private Threads' />
		<UserContext.Consumer>
			{user => user &&
				<>
					<SiteMenuLink to={`/threads/${encodeURIComponent(user.id)}`} indent={indent} label='My Threads' />
					{user.adoptionThreadId &&
						<SiteMenuLink to={`/scout-hub/adoption/${user.adoptionThreadId}`} indent={indent} label='Adoption Thread' />
					}
					{user.adopteeBuddyThreadId &&
						<SiteMenuLink to={`/scout-hub/adoption/${user.adopteeBuddyThreadId}`} indent={indent} label='Adoptee Buddy Thread' />
					}
				</>
			}
		</UserContext.Consumer>
		<SiteMenuLink to='/followed/thread' indent={indent} label='Followed Threads' />
		<SiteMenuLink to='/followed/board' indent={indent} label='Followed Boards' />
		<RequirePermission permission='use-buddy-system' silent>
			<SiteMenuLink to='/buddies' indent={indent} label='Buddies' />
		</RequirePermission>
		<SiteMenuLink to='/tickets' indent={indent} label='Tickets' />
	</>;

	const Community: FC<{ indent?: boolean }> = ({ indent }) => <>
		<SiteMenuLink to={`/forums/${encodeURIComponent(constants.boardIds.accForums)}`} indent={indent} label='Forums' />
		<RequirePermission permission='view-guides' silent>
			<SiteMenuLink to='/guides' indent={indent} label='Guides' />
		</RequirePermission>
		<RequirePermission permission='use-friend-codes' silent>
			<SiteMenuLink to='/friend-codes' indent={indent} label='Friend Codes' />
		</RequirePermission>
		<RequirePermission permission='use-trading-post' silent>
			<SiteMenuLink to='/trading-post' indent={indent} label='Trading Post' />
		</RequirePermission>
		<RequireUser silent>
			<RequirePermission permission='view-shops' silent>
				<SiteMenuLink to='/shops' indent={indent} label='Shops & Services' />
			</RequirePermission>
		</RequireUser>
		<RequirePermission permission='view-patterns' silent>
			<SiteMenuLink to='/patterns' indent={indent} label='Patterns' />
		</RequirePermission>
		<RequirePermission permission='view-tunes' silent>
			<SiteMenuLink to='/town-tunes' indent={indent} label='Town Tunes' />
		</RequirePermission>
		<RequirePermission permission='purchase-bell-shop' silent>
			<SiteMenuLink to='/bell-shop' indent={indent} label='Bell Shop' />
		</RequirePermission>
		<UserContext.Consumer>
			{user => user &&
				<SiteMenuLink to='/top-bells' indent={indent} label='Top Bells' />
			}
		</UserContext.Consumer>
	</>;

	const Staff: FC<{ indent?: boolean }> = ({ indent }) => <>
		<RequireTestSite>
			<SiteMenuLink to='/automation' indent={indent} label='Automation' />
		</RequireTestSite>
		<UserContext.Consumer>
			{user => user &&
				<RequirePermission permission='scout-pages' silent>
					<SiteMenuLink to='/scout-hub' indent={indent} label='Scout Hub' />
				</RequirePermission>
			}
		</UserContext.Consumer>
		<RequirePermission permission='admin-pages' silent>
			<SiteMenuLink to='/admin' indent={indent} label='Admin' />
		</RequirePermission>
		<RequirePermission permission='modmin-pages' silent>
			<SiteMenuLink to='/modmin' indent={indent} label='Modmin' />
		</RequirePermission>
	</>;


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
				<UserContext.Consumer>
					{user => user &&
						<li className='SiteMenu_link SiteMenu_userInfo'>
							<div>
								<Link to={`/profile/${encodeURIComponent(user.id)}`}>
									{user.username} ∙ <span className='Menu_link_subtext'>Profile</span>
								</Link> ∙ <Link to='/settings/account'><span className='Menu_link_subtext'>Settings</span></Link>
							</div>
							<div>
								<Link to='/faq#treasure'>
									<div>Bells: {user.bells}</div>
									<div className='Menu_link_subtext Menu_link_subtext_separate_line'>
										All time: {user.allBells} ∙ Missed: {user.missedBells}
										<JackpotContext.Consumer>
											{jackpot => jackpot &&
															<>{' '}∙ Jackpot: {jackpot}</>
											}
										</JackpotContext.Consumer>
									</div>
								</Link>
							</div>
						</li>
					}
				</UserContext.Consumer>
				<RequireClientJS fallback={
					<>
						<RequireUser silent>
							<li className='SiteMenu_link Menu_link_header'>
								<div>My ACC</div>
							</li>
							<MyACC indent={true} />
						</RequireUser>
						<li className='SiteMenu_link Menu_link_header'>
							<div>Community</div>
						</li>
						<Community indent={true} />
						<RequireUser silent>
							<li className='SiteMenu_link Menu_link_header'>
								<div>Staff</div>
							</li>
							<Staff indent={true} />
						</RequireUser>
					</>
				}
				>
					<RequireUser silent>
						<li onClick={() => setMyACCOpen(!myACCOpen)} className='SiteMenu_link Menu_link_header Menu_link_header_cursorPointer'>
							<div>My ACC</div>
							<ArrowToggle open={myACCOpen} />
						</li>
						{myACCOpen && <MyACC indent={true} />}
					</RequireUser>
					<li onClick={() => setCommunityOpen(!communityOpen)} className='SiteMenu_link Menu_link_header Menu_link_header_cursorPointer'>
						<div>Community</div>
						<ArrowToggle open={communityOpen} />
					</li>
					{communityOpen && <Community indent={true} />}
					<RequireUser silent>
						<li onClick={() => setStaffOpen(!staffOpen)} className='SiteMenu_link Menu_link_header Menu_link_header_cursorPointer'>
							<div>Staff</div>
							<ArrowToggle open={staffOpen} />
						</li>
						{staffOpen && <Staff indent={true} />}
					</RequireUser>
				</RequireClientJS>
				<RequireUser silent>
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
									hideTrailingPlaceholder
								/>
							</div>
						</Form>
					</li>
				</RequireUser>
				<UserContext.Consumer>
					{user => user ? <li className='SiteMenu_link'><LogoutButton /></li> :
						<>
							<li className='SiteMenu_link'><LoginButton /></li>
							<SiteMenuLink to='/sign-up' label='Sign Up' />
						</>
					}
				</UserContext.Consumer>
			</ul>
		</nav>
	);
};

SiteMenu.displayName = 'SiteMenu';

type SiteMenuProps = {
	dynamic?: boolean
	closeFunc?: ClickHandlerButtonType
	ref?: Ref<HTMLElement>
};

const SiteMenuLink = ({
	to,
	label,
	indent,
	icon,
}: SiteMenuLinkProps) =>
{
	return (
		<li>
			<Link to={to} className={`SiteMenu_link${indent ? ' Menu_link_indented' : ''}`}>
				<>
					{icon && <div>
						<img className='Menu_link_icon' src={icon} alt={`${label} icon`} />
					</div>}
					<div>{label}</div>
				</>
			</Link>
		</li>
	);
};

type SiteMenuLinkProps = {
	to: string
	label: string
	indent?: boolean
	icon?: string
};

export default SiteMenu;
