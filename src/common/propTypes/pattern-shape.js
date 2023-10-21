import PropTypes from 'prop-types';

import userLiteShape from './user/user-lite-shape.js';

const patternShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	creator: userLiteShape,
	formattedDate: PropTypes.any,
	published: PropTypes.bool,
	isFavorite: PropTypes.bool,
	designId: PropTypes.string,
	data: PropTypes.arrayOf(PropTypes.string),
	dataUrl: PropTypes.string,
	gameId: PropTypes.number,
	paletteId: PropTypes.number,
	gameShortName: PropTypes.string,
	qrCodeUrl: PropTypes.string,
});

export default patternShape;