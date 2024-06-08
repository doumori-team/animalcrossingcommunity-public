import PropTypes from 'prop-types';

const characterShape = PropTypes.shape({
	id: PropTypes.number.isRequired,
	name: PropTypes.string.isRequired,
	town: PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
	}),
	game: PropTypes.shape({
		id: PropTypes.number,
		shortname: PropTypes.string,
		identifier: PropTypes.string,
	}),
	bells: PropTypes.number,
	debt: PropTypes.number,
	hraScore: PropTypes.number,
	bedLocation: PropTypes.shape({
		id: PropTypes.number,
		filename: PropTypes.string,
	}),
	face: PropTypes.shape({
		id: PropTypes.number,
		filename: PropTypes.string,
	}),
	userId: PropTypes.number.isRequired,
	houseSizes: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number,
		name: PropTypes.string,
		groupId: PropTypes.number,
	})),
	nookMiles: PropTypes.number,
	catalogTotal: PropTypes.number,
	happyHomeNetworkId: PropTypes.string,
	creatorId: PropTypes.string,
	museumTotal: PropTypes.number,
});

export default characterShape;