import PropTypes from 'prop-types';

const gameConsoleShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired,
	sequence: PropTypes.number,
	isLegacy: PropTypes.bool,
	isEnabled: PropTypes.bool,
});

export default gameConsoleShape;