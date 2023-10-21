import PropTypes from 'prop-types';

const gameShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	gameConsoleId: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired,
	shortName: PropTypes.string.isRequired,
	pattern: PropTypes.string.isRequired,
	placeholder: PropTypes.string.isRequired,
	sequence: PropTypes.number,
	isEnabled: PropTypes.bool,
});

export default gameShape;