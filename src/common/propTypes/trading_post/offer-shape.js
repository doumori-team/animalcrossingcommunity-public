import PropTypes from 'prop-types';

import userShape from '../user/user-shape.js';
import residentShape from '../town/resident-shape.js';

const offerShape = PropTypes.shape({
	id: PropTypes.number,
	sequence: PropTypes.number,
	user: userShape,
	formattedDate: PropTypes.any,
	status: PropTypes.string,
	bells: PropTypes.number,
	items: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string,
		quantity: PropTypes.number,
		secretCode: PropTypes.string,
		name: PropTypes.string,
	})),
	residents: PropTypes.arrayOf(residentShape),
	comment: PropTypes.string,
	bioLocation: PropTypes.string,
});

export default offerShape;