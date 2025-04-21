import { ReactNode } from 'react';
import { NavLink } from 'react-router';

// Provides toggle ability between subsections of a page

const NavMenu = ({
	children,
}: NavMenuProps) =>
{
	return (
		<nav className='NavMenu'>
			<ul>
				{children}
			</ul>
		</nav>
	);
};

/* Parameters:
 * 	- path: string representing the component to link to. Required.
 */

const Button = ({
	path,
	children,
	index = false,
}: ButtonProps) =>
{
	return (
		<li className = 'NavMenuButton'>
			<NavLink
				to={path}
				className={({ isActive }) =>
					`NavMenuButton_link ${isActive ? 'NavMenuButton_link-selected' : ''}`
				}
				end={index}
			>
				{children}
			</NavLink>
		</li>
	);
};

NavMenu.Button = Button;

type ButtonProps = {
	path: string
	index?: boolean
	children?: ReactNode
};

type NavMenuProps = {
	children?: ReactNode
};

export default NavMenu;
