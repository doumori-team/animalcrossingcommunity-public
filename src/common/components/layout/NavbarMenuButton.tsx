import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';

import { RequireClientJS } from '@behavior';
import SiteMenu from '@/components/layout/SiteMenu.tsx';
import BuddiesMenu from '@/components/layout/BuddiesMenu.tsx';
import { Button } from '@form';
import { LocationType, BuddiesType } from '@types';

const navbardockmenubreakpoint = 1100;

/*
 * Button that appears in the navbar to open a menu.
 * Props:
 * 	- children: Content of the button (e.g. icon, text)
 * 	- fallbackLink: page to go to instead if the menu fails to work
 * 		The menu is fairly difficult to animate with CSS alone, so if we
 * 		don't have JS available, just replace it with a link to a menu on a
 * 		separate page. Functions equally well, just a little less flashy.
 */
const NavbarMenuButton = ({
	children,
	fallbackLink,
	buddies,
	dockMenu = false,
}: NavbarMenuButtonProps) =>
{
	const [menuOpen, setMenuOpen] = useState<boolean>(dockMenu);

	const location = useLocation() as LocationType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ref = useRef<any>(null);

	let className = 'NavbarMenuButton';

	if (menuOpen)
	{
		className += ' NavbarMenuButton-active';
	}

	if (buddies)
	{
		className += ' NavbarMenuButton-buddies';
	}
	else
	{
		if (dockMenu)
		{
			className += ' NavbarMenuButton-siteMenu';
		}
		else
		{
			className += ' NavbarMenuButton-siteMenuNotDocked';
		}
	}

	// Close the menu whenever we navigate away from the current page.
	useEffect(() =>
	{
		if (!dockMenu || dockMenu && typeof window !== 'undefined' && window.innerWidth < navbardockmenubreakpoint)
		{
			setMenuOpen(false);
		}
	}, [location.pathname]);

	// close the menu whenever we click outside the site menu
	useEffect(() =>
	{
		const handleClickOutside = (event: MouseEvent) =>
		{
			if (!dockMenu || dockMenu && typeof window !== 'undefined' && window.innerWidth < navbardockmenubreakpoint)
			{
				if (!ref.current?.contains(event.target))
				{
					setMenuOpen(false);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
	}, [ref]);

	const toggleMenu = () =>
	{
		setMenuOpen(!menuOpen);
	};

	return (
		<RequireClientJS fallback={
			<Link to={fallbackLink} className='NavbarMenuButton'>
				{children}
			</Link>
		}
		>
			<Button
				className={className}
				clickHandler={toggleMenu}
				label='Menu'
			>
				{children}
			</Button>
			{menuOpen && (
				buddies ?
					<BuddiesMenu dynamic closeFunc={toggleMenu} ref={ref} buddies={buddies} />
					:
					<SiteMenu dynamic closeFunc={toggleMenu} ref={ref} dockMenu={dockMenu} />

			)}
		</RequireClientJS>
	);
};

type NavbarMenuButtonProps = {
	children?: ReactNode
	fallbackLink: string
	buddies?: BuddiesType
	dockMenu?: boolean
};

export default NavbarMenuButton;
