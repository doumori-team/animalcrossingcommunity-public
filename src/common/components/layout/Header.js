import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Header = ({links, name, link, children, description, description2}) =>
{
	return (
		<div className='Header'>
			{links && (
				<div className='Header_links'>
					{links}
				</div>
			)}

			<h1 className='Header_name'>
				{link ? (
					<Link to={link}>
						{name}
					</Link>
				) : (
					name
				)}
			</h1>

			{description && (
				<div className='Header_description'>
					{description}
				</div>
			)}

			{description2 && (
				<div className='Header_description'>
					{description2}
				</div>
			)}

			{children}
		</div>
	);
}

Header.propTypes = {
	links: PropTypes.any,
	name: PropTypes.any.isRequired,
	link: PropTypes.string,
	children: PropTypes.any,
	description: PropTypes.any,
	description2: PropTypes.any,
};

export default Header;