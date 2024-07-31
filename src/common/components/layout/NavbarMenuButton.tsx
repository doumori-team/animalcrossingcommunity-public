import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { RequireClientJS } from '@behavior';
import SiteMenu from '@/components/layout/SiteMenu.tsx';
import BuddiesMenu from '@/components/layout/BuddiesMenu.tsx';
import { Button } from '@form';
import { LocationType, BuddiesType } from '@types';

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
	buddies
}: NavbarMenuButtonProps) =>
{
	const [menuOpen, setMenuOpen] = useState<boolean>(false);

	const location = useLocation() as LocationType;
	const ref = useRef<any>();

	let className = 'NavbarMenuButton';

	if (menuOpen)
	{
		className += ' NavbarMenuButton-active';
	}

	// Close the menu whenever we navigate away from the current page.
	useEffect(() => {
		setMenuOpen(false);
	}, [location.pathname]);

	// close the menu whenever we click outside the site menu
	useEffect(() => {
		const handleClickOutside = (event:MouseEvent) => {
			if (!ref.current?.contains(event.target))
			{
				setMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
	}, [ref]);

	const toggleMenu = () =>
	{
		setMenuOpen(!menuOpen);
	}

	return (
		<RequireClientJS fallback={
			<Link to={fallbackLink} className='NavbarMenuButton'>
				{children}
			</Link>
		}>
			<Button
				className={className}
				clickHandler={toggleMenu}
				label='Menu'
			>
				{children}
			</Button>
			{menuOpen && (
				buddies ? (
					<BuddiesMenu dynamic closeFunc={toggleMenu} ref={ref} buddies={buddies} />
				) : (
					<SiteMenu dynamic closeFunc={toggleMenu} ref={ref} />
				)
			)}
		</RequireClientJS>
	);
}

type NavbarMenuButtonProps = {
	children: React.ReactNode
	fallbackLink: string
	buddies?: BuddiesType
};

export default NavbarMenuButton;
