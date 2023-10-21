import PropTypes from 'prop-types';

import characterShape from '../avatar/character-shape.js';
import accentShape from '../avatar/accent-shape.js';
import backgroundShape from '../avatar/background-shape.js';
import colorationShape from '../avatar/coloration-shape.js';

const userShape = PropTypes.shape({
	avatar: PropTypes.shape({
		background: PropTypes.shape(backgroundShape).isRequired,
		coloration: colorationShape,
		character: PropTypes.shape(characterShape).isRequired,
		accent: PropTypes.shape(accentShape),
		accentPosition: PropTypes.number
	}),
	group: PropTypes.shape({
		id: PropTypes.number,
		identifier: PropTypes.string,
		name: PropTypes.string,
	}),
	id: PropTypes.number,
	lastActiveTime: PropTypes.any,
	signature: PropTypes.string,
	signatureFormat: PropTypes.string,
	signupDate: PropTypes.any,
	username: PropTypes.string,
	positiveWifiRatingsTotal: PropTypes.string,
	neutralWifiRatingsTotal: PropTypes.string,
	negativeWifiRatingsTotal: PropTypes.string,
	positiveTradedRatingsTotal: PropTypes.string,
	neutralTradeRatingsTotal: PropTypes.string,
	negativeTradeRatingsTotal: PropTypes.string,
	bells: PropTypes.string,
	missedBells: PropTypes.string,
	awayStartDate: PropTypes.any,
	awayEndDate: PropTypes.any,
	scoutUsername: PropTypes.string,
	adoptionThreadId: PropTypes.number,
	adopteeBuddyThreadId: PropTypes.number,
	email: PropTypes.string,
	donations: PropTypes.number,
	nonFormattedTotalBells: PropTypes.number,
	userTitle: PropTypes.string,
	perks: PropTypes.number,
});

export default userShape;