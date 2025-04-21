import { ReactNode } from 'react';
import { Link } from 'react-router';

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
	links?: ReactNode
	name: string | ReactNode
	link?: string
	children?: ReactNode
	description?: string | ReactNode
	description2?: string | ReactNode
};

export default Header;
