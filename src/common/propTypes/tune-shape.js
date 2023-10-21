import PropTypes from 'prop-types';

import userLiteShape from './user/user-lite-shape.js';

const tuneShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	creator: userLiteShape,
	notes: PropTypes.arrayOf(PropTypes.number),
	formattedDate: PropTypes.any,
});

export default tuneShape;