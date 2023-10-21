import React from 'react';
import PropTypes from 'prop-types';

import { Form } from '@form';
import { TreasureContext } from '@contexts';

const TreasureOffer = ({size}) =>
{
	return (
		<div className='TreasureOffer'>
			<TreasureContext.Consumer>
				{treasure => Object.getPrototypeOf(treasure) === Object.prototype && (
					<Form action='v1/treasure/claim'>
						<input type='hidden' name='id' value={treasure.id} />

						<input
							type='image'
							src={`/images/bells/treasure_${size}_${treasure.treasureTypeId}.png`}
							aria-label='Treasure Offer'
							alt='Treasure Offer'
						/>
					</Form>
				)}
			</TreasureContext.Consumer>
		</div>
	);
}

TreasureOffer.propTypes = {
	size: PropTypes.string.isRequired,
};

export default TreasureOffer;
