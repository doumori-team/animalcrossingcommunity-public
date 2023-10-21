import PropTypes from 'prop-types';

const friendCodeShape = PropTypes.shape({
	id: PropTypes.number,
	name: PropTypes.string,
	code: PropTypes.string,
	userId: PropTypes.number,
	pattern: PropTypes.string,
	placeholder: PropTypes.string,
	game: PropTypes.shape({
		id: PropTypes.number,
		acGameId: PropTypes.number,
	}),
	character: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		town: PropTypes.shape({
			id: PropTypes.number,
			name: PropTypes.string,
		}),
		game: PropTypes.shape({
			id: PropTypes.number,
		}),
	}),
	username: PropTypes.string,
	date: PropTypes.any,
});

export default friendCodeShape;