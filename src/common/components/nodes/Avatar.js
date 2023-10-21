import React from 'react';
import PropTypes from 'prop-types';

import {
	avatarBackgroundShape,
	avatarColorationShape,
	avatarCharacterShape,
	avatarAccentShape
} from '@propTypes';

// Component for displaying a user avatar (or an element of it).

const Avatar = ({background, coloration, character, accent, accentPosition}) =>
{
	return (
		<div className='Avatar'
			data-bg-coloration={(background?.colorable || !background) && coloration ? coloration.css : null}
			data-accent-position={accentPosition}
		>
			{character &&
				(
					<img className='Avatar_character' src={`${process.env.AWS_URL}/images/avatars/foregrounds/${character.image}.png`}
				 		srcSet={`
				 			${process.env.AWS_URL}/images/avatars/foregrounds/${character.image}.png 1x,
				 			${process.env.AWS_URL}/images/avatars/foregrounds/${character.image}@2x.png 2x
				 		`}
						alt='Avatar Character'
					/>
				)
			}
			{accent &&
				(
					<img className='Avatar_accent' src={`${process.env.AWS_URL}/images/avatars/accents/${accent.image}.png`}
				 		srcSet={`
				 			${process.env.AWS_URL}/images/avatars/accents/${accent.image}.png 1x,
				 			${process.env.AWS_URL}/images/avatars/accents/${accent.image}@2x.png 2x
				 		`}
						style={{zIndex: accent.zIndex}}
						alt='Avatar Accent'
					/>
				)
			}
			{background &&
				(
					<img className='Avatar_background' src={`${process.env.AWS_URL}/images/avatars/backgrounds/${background.image}.png`}
						srcSet={`
							${process.env.AWS_URL}/images/avatars/backgrounds/${background.image}.png 1x,
							${process.env.AWS_URL}/images/avatars/backgrounds/${background.image}@2x.png 2x
						`}
						alt='Avatar Background'
					/>
				)
			}
		</div>
	);
}

Avatar.propTypes = {
	background: PropTypes.shape(avatarBackgroundShape),
	coloration: avatarColorationShape,
	character: PropTypes.shape(avatarCharacterShape),
	accent: PropTypes.shape(avatarAccentShape),
	accentPosition: PropTypes.number,
}

export default Avatar;