import PropTypes from 'prop-types';

export default {
	id: PropTypes.number,
	name: PropTypes.string.isRequired,
	image: PropTypes.string.isRequired,
	positionable: PropTypes.bool.isRequired,
	zIndex: PropTypes.number.isRequired,
	tags: PropTypes.arrayOf(PropTypes.string)
};