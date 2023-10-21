import PropTypes from 'prop-types';

export default PropTypes.arrayOf(PropTypes.shape({
	type: PropTypes.string,
	category: PropTypes.string,
	userId: PropTypes.number,
}));