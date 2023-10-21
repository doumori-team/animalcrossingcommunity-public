import PropTypes from 'prop-types';

export default {
	id: PropTypes.number,
	name: PropTypes.string.isRequired,
	image: PropTypes.string.isRequired,
	tags: PropTypes.arrayOf(PropTypes.string)
};