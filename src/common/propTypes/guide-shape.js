import PropTypes from 'prop-types';

import userLiteShape from './user/user-lite-shape.js';

export default PropTypes.shape({
	id: PropTypes.number,
	game: PropTypes.shape({
		id: PropTypes.number,
		shortname: PropTypes.string,
	}),
	name: PropTypes.string,
	updatedName: PropTypes.string,
	description: PropTypes.string,
	updatedDescription: PropTypes.string,
	content: PropTypes.string,
	updatedContent: PropTypes.string,
	formattedLastUpdated: PropTypes.string,
	user: userLiteShape,
	formattedLastPublished: PropTypes.string,
	hasChanges: PropTypes.bool,
});
