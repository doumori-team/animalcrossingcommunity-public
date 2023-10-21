import React from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink } from 'react-router-dom';

// Provides toggle ability between subsections of a page

const NavMenu = ({children}) =>
{
	return (
		<nav className='NavMenu'>
			<ul>
				{children}
			</ul>
		</nav>
	);
}

/* Parameters:
 * 	- path: string representing the component to link to. Required.
 */

const Button = ({path, children, index}) =>
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
				{ children }
			</NavLink>
		</li>
	);
}

NavMenu.Button = Button;

Button.propTypes = {
	path: PropTypes.string.isRequired,
	index: PropTypes.bool,
	children: PropTypes.node
}

Button.defaultProps = {
	index: false,
}

NavMenu.propTypes = {
	children: PropTypes.node
}

export default NavMenu;