import PropTypes from 'prop-types';

import userLiteShape from '../user/user-lite-shape.js';

const ticketShape = PropTypes.shape({
	id: PropTypes.number,
	formattedClosed: PropTypes.any,
	type: PropTypes.shape({
		description: PropTypes.string,
		identifier: PropTypes.string,
	}),
	reference: PropTypes.shape({
		id: PropTypes.number,
		url: PropTypes.string,
		text: PropTypes.string,
		format: PropTypes.string,
	}),
	updatedContent: PropTypes.string,
	rule: PropTypes.string,
	violation: PropTypes.string,
	action: PropTypes.shape({
		name: PropTypes.string,
		identifier: PropTypes.string,
	}),
	messages: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		user: userLiteShape,
		formattedDate: PropTypes.any,
		message: PropTypes.string,
	})),
	banLength: PropTypes.string,
});

export default ticketShape;