import PropTypes from 'prop-types';

export default PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	shortname: PropTypes.string,
	hasTown: PropTypes.bool,
	maxResidents: PropTypes.number,
});