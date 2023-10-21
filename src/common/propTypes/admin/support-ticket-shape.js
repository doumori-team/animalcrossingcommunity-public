import PropTypes from 'prop-types';

const supportTicketShape = PropTypes.shape({
	id: PropTypes.number,
	staffOnly: PropTypes.bool,
	user: PropTypes.shape({
		id: PropTypes.number,
		username: PropTypes.string,
	}),
	formattedCreated: PropTypes.any,
	userTicketId: PropTypes.number,
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
	messages: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		user: PropTypes.shape({
			id: PropTypes.number,
			username: PropTypes.string,
		}),
		formattedDate: PropTypes.any,
		message: PropTypes.string,
		staffOnly: PropTypes.bool,
		format: PropTypes.string,
	})),
	status: PropTypes.string,
});

export default supportTicketShape;