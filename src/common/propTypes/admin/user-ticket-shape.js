import PropTypes from 'prop-types';

import userShape from '../user/user-shape.js';
import userLiteShape from '../user/user-lite-shape.js';

const userTicketShape = PropTypes.shape({
	id: PropTypes.number,
	status: PropTypes.string,
	denyReason: PropTypes.string,
	formattedCreated: PropTypes.any,
	formattedLastUpdated: PropTypes.any,
	formattedClosed: PropTypes.any,
	reportedUsers: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
	})),
	type: PropTypes.shape({
		description: PropTypes.string,
		identifier: PropTypes.string,
	}),
	reference: PropTypes.shape({
		id: PropTypes.number,
		url: PropTypes.string,
		text: PropTypes.string,
		format: PropTypes.string,
		parentId: PropTypes.number,
		boardId: PropTypes.number,
	}),
	submitter: userLiteShape,
	updatedContent: PropTypes.string,
	rule: PropTypes.string,
	violation: PropTypes.string,
	action: PropTypes.shape({
		name: PropTypes.string,
		identifier: PropTypes.string,
	}),
	assignee: userLiteShape,
	violator: userShape,
	messages: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		user: userLiteShape,
		formattedDate: PropTypes.any,
		message: PropTypes.string,
		staffOnly: PropTypes.bool,
	})),
	info: PropTypes.string,
	ban: PropTypes.shape({
		id: PropTypes.number,
		description: PropTypes.string,
		days: PropTypes.number,
	}),
	currentBan: PropTypes.shape({
		id: PropTypes.number,
		description: PropTypes.string,
		days: PropTypes.number,
	}),
	supportTickets: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		title: PropTypes.string,
	})),
});

export default userTicketShape;