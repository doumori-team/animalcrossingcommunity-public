import { ReactNode } from 'react';

import { RequirePermission } from '@behavior';

const Navbar = ({
	children,
}: NavbarProps) =>
{
	return (
		<nav className='Navbar'>
			<ul className='Navbar_content'>
				{children}
			</ul>
		</nav>
	);
};

/* A single clickable option in the navbar.
 *
 * Add any of these props to change its behaviour:
 * 	- extra: Disappear at small screen sizes
 * 	- icon: Become a fixed-size square (designed to have a small icon in it)
 * 	- username: Special behaviour for the username button in the main navbar:
 * 		When combined with "extra", only disappears at *very* small screen
 * 		sizes.
 */
const Item = ({
	children,
	extra,
	icon,
	username,
	permission,
}: ItemProps) =>
{
	let className = 'NavbarItem';

	if (extra)
	{
		className += ' NavbarItem-extra';
	}

	if (icon)
	{
		className += ' NavbarItem-icon';
	}

	if (username)
	{
		className += ' NavbarItem-username';
	}

	if (permission)
	{
		return (
			<RequirePermission silent permission={permission}>
				<li className={className}>{children}</li>
			</RequirePermission>
		);
	}

	return (
		<li className={className}>{children}</li>
	);
};

Navbar.Item = Item;

type ItemProps = {
	children?: ReactNode
	extra?: boolean
	icon?: boolean
	username?: boolean
	permission?: string
};

/* Put this inside the navbar and it will expand to take up as much horizontal
 * space as possible, pushing the rest of the items to either side.
 */
const Spacer = () =>
{
	return <li className='NavbarSpacer'></li>;
};

Navbar.Spacer = Spacer;

type NavbarProps = {
	children: ReactNode
};

export default Navbar;
