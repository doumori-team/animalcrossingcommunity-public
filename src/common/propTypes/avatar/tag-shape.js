import PropTypes from 'prop-types';

const tagShape = PropTypes.shape({
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	isCharacter: PropTypes.bool,
	isAccent: PropTypes.bool,
	isBackground: PropTypes.bool
});

export default tagShape;