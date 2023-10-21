import PropTypes from 'prop-types';

const notificationShape = PropTypes.shape({
	id: PropTypes.number,
	description: PropTypes.string,
	url: PropTypes.string,
	formattedCreated: PropTypes.any,
	formattedNotified: PropTypes.any,
});

export default notificationShape;