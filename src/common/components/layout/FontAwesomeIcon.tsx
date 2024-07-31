import React from 'react';

// Renders an icon from Font Awesome (https://fontawesome.com/),
// who provide modern vector icons for the web - all for free.
//
// To save on filesize, only a small number of icons are supported here.
// Check client/static/fa-solid.svg to see which ones.
// If you need a different icon, download it from the Font Awesome website
// and copy it into fa-solid.svg.
const FontAwesomeIcon = ({
	name,
	alt,
	title
}: FontAwesomeIconProps) =>
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

type FontAwesomeIconProps = {
	name: string
	alt: string
	title?: string // same thing as alt text for an image
};

export default FontAwesomeIcon;