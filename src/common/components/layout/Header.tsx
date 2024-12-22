import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({
	links,
	name,
	link,
	children,
	description,
	description2,
}: HeaderProps) =>
{
	return (
		<div className='Header'>
			{links &&
				<div className='Header_links'>
					{links}
				</div>
			}

			<h1 className='Header_name'>
				{link ?
					<Link to={link}>
						{name}
					</Link>
					:
					name
				}
			</h1>

			{description &&
				<div className='Header_description'>
					{description}
				</div>
			}

			{description2 &&
				<div className='Header_description'>
					{description2}
				</div>
			}

			{children}
		</div>
	);
};

type HeaderProps = {
	links?: React.ReactNode
	name: string | React.ReactNode
	link?: string
	children?: React.ReactNode
	description?: string | React.ReactNode
	description2?: string | React.ReactNode
};

export default Header;
