import React from 'react';

import {
	AvatarBackgroundType,
	AvatarColorationType,
	AvatarCharacterType,
	AvatarAccentType,
	DataBackgroundType,
	DataColorationType,
	DataCharacterType,
	DataAccentType
} from '@types';
import { constants } from '@utils';

// Component for displaying a user avatar (or an element of it).

const Avatar = ({
	background,
	coloration,
	character,
	accent,
	accentPosition
}: AvatarProps) =>
{
	return (
		<div className='Avatar'
			data-bg-coloration={(background?.colorable || !background) && coloration ? coloration.css : null}
			data-accent-position={accentPosition}
		>
			{character &&
				(
					<img className='Avatar_character' src={`${constants.AWS_URL}/images/avatars/foregrounds/${character.image}.png`}
				 		srcSet={`
							${constants.AWS_URL}/images/avatars/foregrounds/${character.image}.png 1x,
							${constants.AWS_URL}/images/avatars/foregrounds/${character.image}@2x.png 2x
				 		`}
						alt='Avatar Character'
					/>
				)
			}
			{accent &&
				(
					<img className='Avatar_accent' src={`${constants.AWS_URL}/images/avatars/accents/${accent.image}.png`}
				 		srcSet={`
							${constants.AWS_URL}/images/avatars/accents/${accent.image}.png 1x,
							${constants.AWS_URL}/images/avatars/accents/${accent.image}@2x.png 2x
				 		`}
						style={{zIndex: accent.zIndex}}
						alt='Avatar Accent'
					/>
				)
			}
			{background &&
				(
					<img className='Avatar_background' src={`${constants.AWS_URL}/images/avatars/backgrounds/${background.image}.png`}
						srcSet={`
							${constants.AWS_URL}/images/avatars/backgrounds/${background.image}.png 1x,
							${constants.AWS_URL}/images/avatars/backgrounds/${background.image}@2x.png 2x
						`}
						alt='Avatar Background'
					/>
				)
			}
		</div>
	);
}

type AvatarProps = {
	background?: AvatarBackgroundType|DataBackgroundType|null
	coloration?: AvatarColorationType|DataColorationType|null
	character?: AvatarCharacterType|DataCharacterType|null
	accent?: AvatarAccentType|DataAccentType|null
	accentPosition?: number|null
}

export default Avatar;