import React from 'react';
import PropTypes from 'prop-types';

// Renders an icon from Font Awesome (https://fontawesome.com/),
// who provide modern vector icons for the web - all for free.
//
// To save on filesize, only a small number of icons are supported here.
// Check client/static/fa-solid.svg to see which ones.
// If you need a different icon, download it from the Font Awesome website
// and copy it into fa-solid.svg.
const FontAwesomeIcon = ({name, alt, title}) =>
{
	return (
		<svg className={`FontAwesomeIcon${title ? ' informational-icon' : ''}`} aria-label={alt}>
			<use href={`/fa-solid.svg#${name}`} />
			{alt}
			{title && (
				<title>{title}</title>
			)}
		</svg>
	);
}

FontAwesomeIcon.propTypes = {
	name: PropTypes.string.isRequired,
	alt: PropTypes.string.isRequired, // same thing as alt text for an image
	title: PropTypes.string,
}

export default FontAwesomeIcon;