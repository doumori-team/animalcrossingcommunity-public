import React from 'react';
import PropTypes from 'prop-types';

import { constants } from '@utils';

const TotalRatings = ({positiveRatingsTotal, neutralRatingsTotal, negativeRatingsTotal, type}) =>
{
	return (
		<div className='TotalRatings'>
			Total <span className='capitalize'>{type}</span> Ratings:
			{' '}<img alt={constants.rating.configs.positive.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.positive.image}`} /> {positiveRatingsTotal}
			{' '}<img alt={constants.rating.configs.neutral.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.neutral.image}`} /> {neutralRatingsTotal}
			{' '}<img alt={constants.rating.configs.negative.imageAlt} src={`${constants.AWS_URL}/images/rating/${constants.rating.configs.negative.image}`} /> {negativeRatingsTotal}
		</div>
	);
}

TotalRatings.propTypes = {
	positiveRatingsTotal: PropTypes.any.isRequired,
	neutralRatingsTotal: PropTypes.any.isRequired,
	negativeRatingsTotal: PropTypes.any.isRequired,
	type: PropTypes.string.isRequired,
};

export default TotalRatings;
