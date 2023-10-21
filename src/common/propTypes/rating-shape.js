import PropTypes from 'prop-types';

const ratingShape = PropTypes.shape({
	id: PropTypes.number,
	username: PropTypes.string,
	ratingUsername: PropTypes.string,
	formattedDate: PropTypes.string,
	rating: PropTypes.string,
	comment: PropTypes.string,
	listingId: PropTypes.number,
	adoptioNodeId: PropTypes.number,
});

export default ratingShape;
