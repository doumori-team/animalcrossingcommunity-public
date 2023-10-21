import PropTypes from 'prop-types';

const residentShape = PropTypes.shape({
	id: PropTypes.string,
	name: PropTypes.string,
	isTown: PropTypes.bool,
	isIsland: PropTypes.bool,
	gameId: PropTypes.number,
	birthday: PropTypes.string,
});

export default residentShape;