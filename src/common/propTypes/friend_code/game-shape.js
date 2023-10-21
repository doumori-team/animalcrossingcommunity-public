import PropTypes from 'prop-types';

const gameShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.name,
	pattern: PropTypes.pattern,
	placeholder: PropTypes.placeholder,
	consoleName: PropTypes.string,
	acGameId: PropTypes.number,
});

export default gameShape;