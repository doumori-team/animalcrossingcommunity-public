import PropTypes from 'prop-types';

import userLiteShape from '../user/user-lite-shape.js';

const featureShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	format: PropTypes.string,
	statusId: PropTypes.string.isRequired,
	status: PropTypes.string.isRequired,
	categoryId: PropTypes.number,
	category: PropTypes.string.isRequired,
	isBug: PropTypes.bool.isRequired,
	staffOnly: PropTypes.bool,
	readOnly: PropTypes.bool,
	assigned: userLiteShape,
	user: userLiteShape,
	formattedCreated: PropTypes.any,
	messages: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		user: userLiteShape,
		formattedDate: PropTypes.any,
		message: PropTypes.string,
		staffOnly: PropTypes.bool,
		format: PropTypes.string,
	})),
	followed: PropTypes.bool,
	staffDescription: PropTypes.string,
	staffDescriptionFormat: PropTypes.string,
	claimed: PropTypes.bool,
	assignedUsers: PropTypes.arrayOf(userLiteShape),
})

export default featureShape;